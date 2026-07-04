import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [demandas, visitas] = await Promise.all([
      prisma.demanda.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { regiao: { select: { nome: true } } },
      }),
      prisma.visita.findMany({
        take: 10,
        orderBy: { data: "desc" },
        include: { regiao: { select: { nome: true } } },
      }),
    ]);

    const timeline: {
      id: string;
      tipo: "demanda" | "visita";
      descricao: string;
      data: string;
    }[] = [
      ...demandas.map((d) => ({
        id: d.id,
        tipo: "demanda" as const,
        descricao: `Nova demanda: ${d.categoria} em ${d.regiao?.nome ?? "região desconhecida"}`,
        data: d.createdAt.toISOString(),
      })),
      ...visitas.map((v) => ({
        id: v.id,
        tipo: "visita" as const,
        descricao: `Visita: ${v.titulo}`,
        data: v.data.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 15);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Erro ao buscar timeline:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
