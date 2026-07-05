import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);

  const metricas = searchParams.getAll("metricas[]");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const regiaoId = searchParams.get("regiaoId");
  const bairroId = searchParams.get("bairroId");
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");
  const responsavel = searchParams.get("responsavel");
  const agruparPor = searchParams.get("agruparPor") || "nenhum";

  const where: Record<string, unknown> = {};
  if (dataInicio) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dataInicio) };
  if (dataFim) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(dataFim) };
  if (regiaoId) where.regiaoId = regiaoId;
  if (bairroId) where.bairroId = bairroId;
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;
  if (responsavel) where.responsavel = responsavel;

  const result: Record<string, unknown> = {};

  if (metricas.includes("demandas") || metricas.length === 0) {
    const total = await prisma.demanda.count({ where });

    if (agruparPor === "bairro") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["bairroId"],
        _count: { id: true },
        where,
      });
      const bairros = await prisma.bairro.findMany({
        select: { id: true, nome: true },
      });
      const mapa = new Map(bairros.map((b) => [b.id, b.nome]));
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: mapa.get(g.bairroId || "") || "Sem bairro",
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "tipo") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["tipo"],
        _count: { id: true },
        where,
      });
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: g.tipo,
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "responsavel") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["responsavel"],
        _count: { id: true },
        where,
      });
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: g.responsavel || "Sem responsável",
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "mes") {
      const demandas = await prisma.demanda.findMany({
        where,
        select: { createdAt: true },
      });
      const porMes: Record<string, number> = {};
      for (const d of demandas) {
        const mes = d.createdAt.toISOString().slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
      result.demandas = {
        total,
        agrupado: Object.entries(porMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, valor]) => ({ label, valor })),
      };
    } else {
      result.demandas = { total };
    }
  }

  if (metricas.includes("visitas")) {
    const whereVisita: Record<string, unknown> = {};
    if (dataInicio) whereVisita.data = { gte: new Date(dataInicio) };
    if (dataFim) whereVisita.data = { lte: new Date(dataFim) };
    if (regiaoId) whereVisita.regiaoId = regiaoId;

    const total = await prisma.visita.count({ where: whereVisita });
    result.visitas = { total };
  }

  if (metricas.includes("contatos")) {
    const total = await prisma.contato.count();
    result.contatos = { total };
  }

  if (metricas.includes("interacoes")) {
    const whereInteracao: Record<string, unknown> = {};
    if (dataInicio) whereInteracao.data = { gte: new Date(dataInicio) };
    if (dataFim) whereInteracao.data = { lte: new Date(dataFim) };

    const total = await prisma.interacao.count({ where: whereInteracao });
    result.interacoes = { total };
  }

  return NextResponse.json(result);
}
