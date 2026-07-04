import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contatoId = searchParams.get("contatoId");
  if (!contatoId) return NextResponse.json({ error: "contatoId required" }, { status: 400 });
  const interacoes = await prisma.interacao.findMany({
    where: { contatoId },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(interacoes);
}

export async function POST(request: Request) {
  const data = await request.json();
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
