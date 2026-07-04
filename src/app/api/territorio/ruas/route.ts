import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bairroId = searchParams.get("bairroId");
  const where = bairroId ? { bairroId } : {};
  const ruas = await prisma.rua.findMany({ where, orderBy: { nome: "asc" } });
  return NextResponse.json(ruas);
}
