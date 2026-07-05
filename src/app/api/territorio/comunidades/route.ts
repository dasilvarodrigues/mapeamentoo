import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const bairroId = searchParams.get("bairroId");
  const where = bairroId ? { bairroId } : {};
  const comunidades = await prisma.comunidade.findMany({ where, orderBy: { nome: "asc" } });
  return NextResponse.json(comunidades);
}
