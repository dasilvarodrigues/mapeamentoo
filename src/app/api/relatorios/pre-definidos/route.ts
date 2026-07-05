import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || "geral";
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const dateFilter: Record<string, unknown> = {};
  if (dataInicio) dateFilter.gte = new Date(dataInicio);
  if (dataFim) dateFilter.lte = new Date(dataFim);

  const whereDate = Object.keys(dateFilter).length
    ? { createdAt: dateFilter }
    : {};

  switch (tipo) {
    case "geral": {
      const [totalDemandas, abertas, resolvidas, visitas, contatos] =
        await Promise.all([
          prisma.demanda.count({ where: whereDate }),
          prisma.demanda.count({ where: { ...whereDate, status: "aberta" } }),
          prisma.demanda.count({
            where: { ...whereDate, status: "resolvida" },
          }),
          prisma.visita.count({ where: whereDate }),
          prisma.contato.count(),
        ]);

      const demandas = await prisma.demanda.findMany({
        where: whereDate,
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      });

      const meses: Record<string, { abertas: number; resolvidas: number }> =
        {};
      for (const d of demandas) {
        const mes = d.createdAt.toISOString().slice(0, 7);
        if (!meses[mes]) meses[mes] = { abertas: 0, resolvidas: 0 };
        if (d.status === "resolvida") meses[mes].resolvidas++;
        else meses[mes].abertas++;
      }

      const evolucaoMensal = Object.entries(meses)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, vals]) => ({ mes, ...vals }));

      return NextResponse.json({
        kpis: [
          { label: "Total de Demandas", value: totalDemandas },
          { label: "Demandas Abertas", value: abertas },
          { label: "Demandas Resolvidas", value: resolvidas },
          { label: "Visitas Realizadas", value: visitas },
          { label: "Contatos Registrados", value: contatos },
        ],
        evolucaoMensal,
      });
    }

    case "localidade": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["bairroId"],
        _count: { id: true },
        where: whereDate,
      });

      const bairros = await prisma.bairro.findMany({
        select: { id: true, nome: true },
      });
      const bairroMap = new Map(bairros.map((b) => [b.id, b.nome]));

      const dados = agrupado
        .map((g) => ({
          nome: bairroMap.get(g.bairroId || "") || "Sem bairro",
          valor: g._count.id,
        }))
        .sort((a, b) => b.valor - a.valor);

      const tabela = dados.map((d) => ({
        bairro: d.nome,
        total: d.valor,
      }));

      return NextResponse.json({ bairros: dados, tabela });
    }

    case "tipo": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["tipo"],
        _count: { id: true },
        where: whereDate,
      });

      const total =
        agrupado.reduce((acc, g) => acc + g._count.id, 0) || 1;
      const distribuicao = agrupado.map((g) => ({
        nome: g.tipo,
        valor: g._count.id,
      }));
      const tabela = agrupado.map((g) => ({
        tipo: g.tipo,
        total: g._count.id,
        percentual: ((g._count.id / total) * 100).toFixed(1) + "%",
      }));

      return NextResponse.json({ distribuicao, tabela });
    }

    case "responsaveis": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["responsavel"],
        _count: { id: true },
        where: whereDate,
      });

      const demandas = await prisma.demanda.findMany({
        where: whereDate,
        select: { responsavel: true, status: true },
      });

      const stats: Record<
        string,
        { total: number; resolvidas: number; pendentes: number }
      > = {};
      for (const d of demandas) {
        const nome = d.responsavel || "Sem responsável";
        if (!stats[nome]) stats[nome] = { total: 0, resolvidas: 0, pendentes: 0 };
        stats[nome].total++;
        if (d.status === "resolvida") stats[nome].resolvidas++;
        else stats[nome].pendentes++;
      }

      const ranking = Object.entries(stats)
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json({ ranking });
    }

    case "cobertura": {
      const regioes = await prisma.regiao.findMany({
        include: {
          bairros: {
            include: {
              _count: { select: { demandas: true } },
              comunidades: { select: { id: true } },
            },
          },
        },
      });

      const dados = regioes.map((r) => ({
        regiao: r.nome,
        bairros: r.bairros.map((b) => ({
          nome: b.nome,
          totalDemandas: b._count.demandas,
          comunidades: b.comunidades.length,
        })),
      }));

      return NextResponse.json({ dados });
    }

    case "crm": {
      const whereInteracao: Record<string, unknown> = {};
      const dataFilterInteracao: Record<string, unknown> = {};
      if (dataInicio) dataFilterInteracao.gte = new Date(dataInicio);
      if (dataFim) dataFilterInteracao.lte = new Date(dataFim);
      if (Object.keys(dataFilterInteracao).length) whereInteracao.data = dataFilterInteracao;

      const interacoes = await prisma.interacao.findMany({
        where: whereInteracao,
        include: { contato: { select: { nome: true } } },
        orderBy: { data: "desc" },
        take: 50,
      });

      const contatosAtivos = await prisma.contato.count();

      const interacoesPorMesRaw = await prisma.interacao.findMany({
        where: whereInteracao,
        select: { data: true },
      });

      const porMes: Record<string, number> = {};
      for (const i of interacoesPorMesRaw) {
        const mes = i.data.toISOString().slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + 1;
      }

      const interacoesPorMes = Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([nome, valor]) => ({ nome, valor }));

      return NextResponse.json({
        interacoes: interacoes.map((i) => ({
          data: i.data.toISOString(),
          tipo: i.tipo,
          descricao: i.descricao,
          contato: i.contato.nome,
          responsavel: i.responsavel,
        })),
        contatosAtivos,
        interacoesPorMes,
      });
    }

    default:
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
}
