import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bairroId = searchParams.get("bairroId");
  const where = bairroId ? { bairroId } : {};
  const setores = await prisma.setor.findMany({ where, orderBy: { nome: "asc" } });
  return NextResponse.json(setores);
}
