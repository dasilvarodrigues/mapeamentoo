import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const contatoId = searchParams.get("contatoId");
  if (!contatoId) return NextResponse.json({ error: "contatoId required" }, { status: 400 });
  const where: Record<string, unknown> = { contatoId };
  if (session.user.role === "agente") {
    where.responsavel = session.user.nome;
  }
  const interacoes = await prisma.interacao.findMany({
    where,
    orderBy: { data: "desc" },
  });
  return NextResponse.json(interacoes);
}

export async function POST(request: Request) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const data = await request.json();
  if (session.user.role === "agente") {
    data.responsavel = session.user.nome;
  }
  const interacao = await prisma.interacao.create({
    data: {
      tipo: data.tipo,
      descricao: data.descricao,
      data: new Date(data.data),
      responsavel: data.responsavel,
      contatoId: data.contatoId,
      demandaId: data.demandaId || null,
    },
  });
  return NextResponse.json(interacao, { status: 201 });
}
