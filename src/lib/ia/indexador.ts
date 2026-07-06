import { prisma } from "@/lib/prisma";
import { gerarEmbedding } from "./embedding";

async function criarChunk(
  conteudo: string,
  metadata: Record<string, unknown>,
  fonte: string
) {
  const embedding = await gerarEmbedding(conteudo);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "IaChunk" (id, conteudo, metadata, embedding, fonte, criado_em, atualizado_em)
     VALUES ($1, $2, $3::jsonb, $4::vector, $5, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       conteudo = EXCLUDED.conteudo,
       metadata = EXCLUDED.metadata,
       embedding = EXCLUDED.embedding,
       fonte = EXCLUDED.fonte,
       atualizado_em = NOW()`,
    crypto.randomUUID(),
    conteudo,
    JSON.stringify(metadata),
    `[${embedding.join(",")}]`,
    fonte
  );
}

export async function reindexarTudo() {
  await prisma.$executeRawUnsafe(`TRUNCATE "IaChunk"`);

  // 1. KPI — resumo geral
  const [totalRegioes, totalBairros, totalComunidades, demandas, totalVisitas, totalContatos] =
    await Promise.all([
      prisma.regiao.count(),
      prisma.bairro.count(),
      prisma.comunidade.count(),
      prisma.demanda.groupBy({ by: ["status"], _count: true }),
      prisma.visita.count(),
      prisma.contato.count(),
    ]);

  const demandasAbertas = demandas.find((d) => d.status === "aberta")?._count ?? 0;
  const demandasAndamento = demandas.find((d) => d.status === "em_andamento")?._count ?? 0;
  const demandasResolvidas = demandas.find((d) => d.status === "resolvida")?._count ?? 0;

  await criarChunk(
    `O sistema possui ${totalRegioes} regiões, ${totalBairros} bairros, ${totalComunidades} comunidades. ` +
    `Total de demandas: ${demandasAbertas + demandasAndamento + demandasResolvidas} ` +
    `(${demandasAbertas + demandasAndamento} abertas/em andamento, ${demandasResolvidas} resolvidas). ` +
    `Total de visitas: ${totalVisitas}. Total de contatos no CRM: ${totalContatos}.`,
    { tipo: "resumo_geral" },
    "kpi"
  );

  // 2. Demandas por região
  const demandasPorRegiao = await prisma.regiao.findMany({
    include: {
      _count: { select: { demandas: true } },
      demandas: { select: { status: true, tipo: true } },
    },
  });

  for (const regiao of demandasPorRegiao) {
    if (regiao._count.demandas === 0) continue;
    const porStatus: Record<string, number> = {};
    for (const d of regiao.demandas) {
      porStatus[d.status] = (porStatus[d.status] || 0) + 1;
    }
    const resumoStatus = Object.entries(porStatus)
      .map(([s, n]) => `${n} ${s}`)
      .join(", ");
    await criarChunk(
      `Na região ${regiao.nome} (${regiao.municipio}/${regiao.uf}) há ${regiao._count.demandas} demandas. Status: ${resumoStatus}.`,
      { tipo: "demanda", regiao: regiao.nome, municipio: regiao.municipio },
      "demanda"
    );
  }

  // 3. Território — hierarquia
  const estados = await prisma.estado.findMany({
    include: {
      municipios: {
        include: {
          bairros: { select: { _count: { select: { comunidades: true } } } },
        },
      },
    },
  });

  for (const estado of estados) {
    for (const municipio of estado.municipios) {
      const totalBairrosMunicipio = municipio.bairros.length;
      const totalComunidadesMunicipio = municipio.bairros.reduce(
        (acc, b) => acc + b._count.comunidades, 0
      );
      await criarChunk(
        `O município de ${municipio.nome} (${estado.uf}, ${estado.nome}) possui ${totalBairrosMunicipio} bairros e ${totalComunidadesMunicipio} comunidades.`,
        { tipo: "territorio", uf: estado.uf, municipio: municipio.nome },
        "territorio"
      );
    }
  }

  // 4. CRM — resumo de contatos
  const contatosPorBairro = await prisma.contato.groupBy({
    by: ["bairroId"],
    _count: true,
  });

  const bairrosComContatos = await prisma.bairro.findMany({
    where: { id: { in: contatosPorBairro.map((c) => c.bairroId).filter(Boolean) as string[] } },
    select: { id: true, nome: true, regiao: { select: { nome: true } } },
  });

  const bairroMap = new Map(bairrosComContatos.map((b) => [b.id, b]));
  const topBairros = contatosPorBairro
    .filter((c) => c.bairroId && bairroMap.get(c.bairroId))
    .sort((a, b) => b._count - a._count)
    .slice(0, 10);

  if (topBairros.length > 0) {
    const textoBairros = topBairros.map((c) => {
      const bairro = bairroMap.get(c.bairroId!)!
      return bairro.nome!.toString() + " (" + c._count + ")"
    }).join(", ")
    await criarChunk(
      "Top bairros com mais contatos no CRM: " + textoBairros + ". Total de contatos: " + totalContatos + ".",
      { tipo: "crm_resumo" },
      "crm"
    );
  }
}
