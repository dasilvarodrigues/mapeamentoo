import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  try {
    const regioes = await prisma.regiao.findMany({
      include: {
        _count: {
          select: { demandas: true },
        },
      },
    });

    const features = regioes.map((r) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [r.longitude ?? 0, r.latitude ?? 0],
      },
      properties: {
        id: r.id,
        nome: r.nome,
        totalDemandas: r._count.demandas,
      },
    }));

    const demandas = await prisma.demanda.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        categoria: true,
        status: true,
        latitude: true,
        longitude: true,
        regiao: { select: { nome: true } },
      },
      take: 200,
    });

    const pontos = demandas.map((d) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [d.longitude ?? 0, d.latitude ?? 0],
      },
      properties: {
        id: d.id,
        categoria: d.categoria,
        status: d.status,
        regiao: d.regiao?.nome ?? "",
      },
    }));

    return NextResponse.json({
      type: "FeatureCollection",
      features: [...features, ...pontos],
    });
  } catch (error) {
    console.error("Erro ao buscar mapa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
