import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const demandas = await prisma.demanda.findMany({
      select: { createdAt: true, status: true, categoria: true },
    });

    const meses = new Map<string, { total: number; resolvidas: number }>();
    const categorias = new Map<string, number>();

    const mesesNomes = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];

    for (const d of demandas) {
      const mes = `${mesesNomes[d.createdAt.getMonth()]}/${d.createdAt.getFullYear()}`;
      const entry = meses.get(mes) ?? { total: 0, resolvidas: 0 };
      entry.total++;
      if (d.status === "resolvida") entry.resolvidas++;
      meses.set(mes, entry);

      categorias.set(d.categoria, (categorias.get(d.categoria) ?? 0) + 1);
    }

    const mesesArray = Array.from(meses.entries())
      .map(([mes, vals]) => ({ mes, ...vals }))
      .slice(-6);

    const categoriasArray = Array.from(categorias.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ meses: mesesArray, categorias: categoriasArray });
  } catch (error) {
    console.error("Erro ao buscar gráficos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
