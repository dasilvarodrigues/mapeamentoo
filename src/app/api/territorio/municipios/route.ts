import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const estadoId = searchParams.get("estadoId");
  const where = estadoId ? { estadoId } : {};
  const municipios = await prisma.municipio.findMany({ where, orderBy: { nome: "asc" } });
  return NextResponse.json(municipios);
}
