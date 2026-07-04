import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const municipioId = searchParams.get("municipioId");
  const where = municipioId ? { municipioId } : {};
  const bairros = await prisma.bairro.findMany({ where, orderBy: { nome: "asc" } });
  return NextResponse.json(bairros);
}
