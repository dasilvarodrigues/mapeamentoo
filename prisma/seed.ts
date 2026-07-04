import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const regioesSP = [
  { nome: "Zona Norte", latitude: -23.480, longitude: -46.630 },
  { nome: "Zona Sul", latitude: -23.650, longitude: -46.640 },
  { nome: "Zona Leste", latitude: -23.550, longitude: -46.450 },
  { nome: "Zona Oeste", latitude: -23.550, longitude: -46.750 },
  { nome: "Centro", latitude: -23.550, longitude: -46.635 },
  { nome: "Rural", latitude: -23.800, longitude: -46.700 },
];

const nomesBairros: Record<string, string[]> = {
  "Zona Norte": ["Santana", "Tucuruvi", "Vila Maria"],
  "Zona Sul": ["Jabaquara", "Saúde", "Cidade Ademar"],
  "Zona Leste": ["Penha", "Itaquera", "São Miguel"],
  "Zona Oeste": ["Pinheiros", "Butantã", "Rio Pequeno"],
  Centro: ["República", "Sé", "Consolação"],
  Rural: ["Parelheiros", "Marsilac", "Engenheiro Marsilac"],
};

const coordenadasBairros: Record<string, { lat: number; lng: number }[]> = {
  "Zona Norte": [
    { lat: -23.500, lng: -46.620 },
    { lat: -23.480, lng: -46.640 },
    { lat: -23.460, lng: -46.610 },
  ],
  "Zona Sul": [
    { lat: -23.640, lng: -46.640 },
    { lat: -23.630, lng: -46.655 },
    { lat: -23.670, lng: -46.660 },
  ],
  "Zona Leste": [
    { lat: -23.540, lng: -46.460 },
    { lat: -23.560, lng: -46.470 },
    { lat: -23.530, lng: -46.440 },
  ],
  "Zona Oeste": [
    { lat: -23.560, lng: -46.700 },
    { lat: -23.570, lng: -46.720 },
    { lat: -23.540, lng: -46.740 },
  ],
  Centro: [
    { lat: -23.545, lng: -46.640 },
    { lat: -23.550, lng: -46.630 },
    { lat: -23.555, lng: -46.650 },
  ],
  Rural: [
    { lat: -23.780, lng: -46.700 },
    { lat: -23.790, lng: -46.720 },
    { lat: -23.810, lng: -46.680 },
  ],
};

  const categorias = [
    "iluminação",
    "pavimentação",
    "saúde",
    "educação",
    "segurança",
    "saneamento",
  ];

  const tipos = ["emergencial", "rotina", "projeto"];
  const responsaveis = ["Carlos Silva", "Ana Oliveira", "Pedro Santos", "Maria Costa", "João Souza"];

async function main() {
  // Estados brasileiros
  const estados = await Promise.all([
    prisma.estado.create({ data: { id: "35", nome: "São Paulo", uf: "SP" } }),
    prisma.estado.create({ data: { id: "33", nome: "Rio de Janeiro", uf: "RJ" } }),
    prisma.estado.create({ data: { id: "31", nome: "Minas Gerais", uf: "MG" } }),
    prisma.estado.create({ data: { id: "41", nome: "Paraná", uf: "PR" } }),
    prisma.estado.create({ data: { id: "43", nome: "Rio Grande do Sul", uf: "RS" } }),
    prisma.estado.create({ data: { id: "29", nome: "Bahia", uf: "BA" } }),
    prisma.estado.create({ data: { id: "53", nome: "Distrito Federal", uf: "DF" } }),
  ]);

  const sp = estados.find(e => e.uf === "SP")!;

  const municipiosData = [
    { nome: "São Paulo", estadoId: sp.id },
    { nome: "Guarulhos", estadoId: sp.id },
    { nome: "Campinas", estadoId: sp.id },
    { nome: "São Bernardo do Campo", estadoId: sp.id },
    { nome: "Santo André", estadoId: sp.id },
    { nome: "Osasco", estadoId: sp.id },
    { nome: "Sorocaba", estadoId: sp.id },
    { nome: "Ribeirão Preto", estadoId: sp.id },
  ];
  await prisma.municipio.createMany({ data: municipiosData });

  // Clear existing data
  await prisma.interacao.deleteMany();
  await prisma.contato.deleteMany();
  await prisma.rua.deleteMany();
  await prisma.setor.deleteMany();
  await prisma.visita.deleteMany();
  await prisma.demanda.deleteMany();
  await prisma.comunidade.deleteMany();
  await prisma.bairro.deleteMany();
  await prisma.regiao.deleteMany();
  await prisma.municipio.deleteMany();
  await prisma.estado.deleteMany();

  const regioes = [];
  for (const r of regioesSP) {
    const regiao = await prisma.regiao.create({
      data: {
        nome: r.nome,
        municipio: "São Paulo",
        uf: "SP",
        latitude: r.latitude,
        longitude: r.longitude,
      },
    });
    regioes.push(regiao);
  }

  const allBairros: { id: string; regiaoNome: string }[] = [];

  for (const regiao of regioes) {
    const bairrosNomes = nomesBairros[regiao.nome] || [];
    const coords = coordenadasBairros[regiao.nome] || [];
    for (let i = 0; i < bairrosNomes.length; i++) {
      const bairro = await prisma.bairro.create({
        data: {
          nome: bairrosNomes[i],
          regiaoId: regiao.id,
          latitude: coords[i]?.lat ?? null,
          longitude: coords[i]?.lng ?? null,
        },
      });
      allBairros.push({ id: bairro.id, regiaoNome: regiao.nome });

      // Create 2 comunidades per bairro
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      await prisma.comunidade.createMany({
        data: [
          {
            nome: `${bairrosNomes[i]} - Comunidade A`,
            bairroId: bairro.id,
            latitude: (coords[i]?.lat ?? 0) + offsetLat,
            longitude: (coords[i]?.lng ?? 0) + offsetLng,
          },
          {
            nome: `${bairrosNomes[i]} - Comunidade B`,
            bairroId: bairro.id,
            latitude: (coords[i]?.lat ?? 0) - offsetLat,
            longitude: (coords[i]?.lng ?? 0) - offsetLng,
          },
        ],
      });
    }
  }

  // Create demandas distributed across regions
  const demandasData: {
    categoria: string;
    descricao: string;
    tipo: string;
    status: string;
    prioridade: number;
    responsavel: string;
    regiaoId: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    resolvedAt: Date | null;
    bairroId: null;
  }[] = [];

  for (const regiao of regioes) {
    const coordsRegiao = regioesSP.find((r) => r.nome === regiao.nome)!;
    for (let i = 0; i < 34; i++) {
      const categoria = categorias[i % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      const diasAtras = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - diasAtras);
      const resolvedAt =
        status === "resolvida"
          ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

      demandasData.push({
        categoria,
        descricao: `Demanda de ${categoria} na ${regiao.nome} - registro ${i + 1}`,
        tipo: tipos[i % 3],
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        responsavel: responsaveis[i % responsaveis.length],
        regiaoId: regiao.id,
        latitude: coordsRegiao.latitude + (Math.random() - 0.5) * 0.05,
        longitude: coordsRegiao.longitude + (Math.random() - 0.5) * 0.05,
        createdAt,
        resolvedAt,
        bairroId: null,
      });
    }
  }

  await prisma.demanda.createMany({ data: demandasData });

  // Additional demandas with different tipos
  const maisDemandas: typeof demandasData = [];

  for (const regiao of regioes) {
    const coordsRegiao = regioesSP.find((r) => r.nome === regiao.nome)!;
    for (let i = 0; i < 16; i++) {
      const categoria = categorias[(i + 2) % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      const diasAtras = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - diasAtras);
      const resolvedAt =
        status === "resolvida"
          ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

      maisDemandas.push({
        categoria,
        descricao: `Demanda ${tipos[i % 3]} de ${categoria} - ${regiao.nome} (${i + 1})`,
        tipo: tipos[i % 3],
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        responsavel: responsaveis[i % responsaveis.length],
        regiaoId: regiao.id,
        latitude: coordsRegiao.latitude + (Math.random() - 0.5) * 0.05,
        longitude: coordsRegiao.longitude + (Math.random() - 0.5) * 0.05,
        createdAt,
        resolvedAt,
        bairroId: null,
      });
    }
  }

  await prisma.demanda.createMany({ data: maisDemandas });

  // Create visits
  const visitasData: {
    titulo: string;
    regiaoId: string;
    data: Date;
  }[] = [];

  for (const regiao of regioes) {
    for (let i = 0; i < 20; i++) {
      const diasAtras = Math.floor(Math.random() * 180);
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      visitasData.push({
        titulo: `Visita técnica - ${regiao.nome} (${i + 1})`,
        regiaoId: regiao.id,
        data,
      });
    }
  }

  await prisma.visita.createMany({ data: visitasData });

  // CRM seed
  await prisma.interacao.deleteMany();
  await prisma.contato.deleteMany();

  const todosBairros = await prisma.bairro.findMany();
  const responsaveisCrm = ["Carlos Silva", "Ana Oliveira", "Pedro Santos"];

  const contatosData = [
    { nome: "Maria Silva", telefone: "(11) 99999-0001", email: "maria@email.com", cargo: "Líder Comunitária", bairroId: todosBairros[0]?.id || null },
    { nome: "João Santos", telefone: "(11) 99999-0002", email: "joao@email.com", cargo: "Presidente da Associação", bairroId: todosBairros[1]?.id || null },
    { nome: "Ana Costa", telefone: "(11) 99999-0003", email: null, cargo: "Representante de Rua", bairroId: todosBairros[2]?.id || null },
    { nome: "Carlos Pereira", telefone: "(11) 99999-0004", email: "carlos@email.com", cargo: "Vice-líder", bairroId: todosBairros[3]?.id || null },
    { nome: "Lucia Oliveira", telefone: "(11) 99999-0005", email: null, cargo: "Voluntária", bairroId: todosBairros[4]?.id || null },
    { nome: "Pedro Souza", telefone: "(11) 99999-0006", email: "pedro@email.com", cargo: "Membro do Conselho", bairroId: todosBairros[5]?.id || null },
    { nome: "Marina Lima", telefone: "(11) 99999-0007", email: "marina@email.com", cargo: "Líder Juvenil", bairroId: todosBairros[6]?.id || null },
    { nome: "Roberto Alves", telefone: "(11) 99999-0008", email: null, cargo: "Comerciante Local", bairroId: todosBairros[7]?.id || null },
    { nome: "Carla Mendes", telefone: "(11) 99999-0009", email: "carla@email.com", cargo: "Professora", bairroId: todosBairros[8]?.id || null },
    { nome: "Fernando Dias", telefone: "(11) 99999-0010", email: null, cargo: "Aposentado", bairroId: todosBairros[0]?.id || null },
  ];

  for (const c of contatosData) {
    const contato = await prisma.contato.create({ data: c });

    const numInteracoes = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numInteracoes; i++) {
      const diasAtras = Math.floor(Math.random() * 60);
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      const tipos = ["visita", "ligacao", "reuniao", "mensagem"];
      await prisma.interacao.create({
        data: {
          tipo: tipos[i % 4],
          descricao: `${tipos[i % 4].charAt(0).toUpperCase() + tipos[i % 4].slice(1)} com ${c.nome} - ${["Discussão sobre demandas", "Acompanhamento de obra", "Reunião de planejamento", "Contato de rotina"][i % 4]}`,
          data,
          responsavel: responsaveisCrm[i % responsaveisCrm.length],
          contatoId: contato.id,
        },
      });
    }
  }

  const totalDemandas = await prisma.demanda.count();
  const totalVisitas = await prisma.visita.count();
  const totalContatos = await prisma.contato.count();
  console.log(`Seed concluído! ${totalDemandas} demandas, ${totalVisitas} visitas, ${totalContatos} contatos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
