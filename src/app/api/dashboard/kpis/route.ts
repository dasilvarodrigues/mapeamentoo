import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  try {
    const [totalRegioes, totalBairros, totalComunidades, demandas, totalVisitas] =
      await Promise.all([
        prisma.regiao.count(),
        prisma.bairro.count(),
        prisma.comunidade.count(),
        prisma.demanda.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.visita.count(),
      ]);

    const totalRegistros = await prisma.demanda.count();
    const demandasAbertas =
      demandas.find((d) => d.status === "aberta")?._count ?? 0;
    const demandasAndamento =
      demandas.find((d) => d.status === "em_andamento")?._count ?? 0;
    const demandasResolvidas =
      demandas.find((d) => d.status === "resolvida")?._count ?? 0;

    return NextResponse.json({
      totalRegioes,
      totalBairros,
      totalComunidades,
      totalRegistros,
      demandasAbertas: demandasAbertas + demandasAndamento,
      demandasResolvidas,
      totalVisitas,
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
