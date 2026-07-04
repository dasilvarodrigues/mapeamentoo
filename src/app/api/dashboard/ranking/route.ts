import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const regioes = await prisma.regiao.findMany({
      include: {
        _count: {
          select: { demandas: true },
        },
        demandas: {
          select: { status: true },
        },
      },
    });

    const ranking = regioes
      .map((r) => {
        const abertas = r.demandas.filter(
          (d) => d.status === "aberta" || d.status === "em_andamento"
        ).length;
        const resolvidas = r.demandas.filter(
          (d) => d.status === "resolvida"
        ).length;
        const total = r._count.demandas;
        return {
          regiao: r.nome,
          total,
          abertas,
          resolvidas,
          percentual: total > 0 ? Math.round((resolvidas / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
