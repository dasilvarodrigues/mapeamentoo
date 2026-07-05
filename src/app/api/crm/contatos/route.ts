import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca");
  const bairroId = searchParams.get("bairroId");

  const where: Record<string, unknown> = {};
  if (busca) where.nome = { contains: busca, mode: "insensitive" };
  if (bairroId) where.bairroId = bairroId;

  const contatos = await prisma.contato.findMany({
    where,
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(contatos);
}

export async function POST(request: Request) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const data = await request.json();
  const contato = await prisma.contato.create({
    data: {
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || null,
      cargo: data.cargo || null,
      redesSociais: data.redesSociais ? JSON.parse(data.redesSociais) : null,
      bairroId: data.bairroId || null,
      comunidadeId: data.comunidadeId || null,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(contato, { status: 201 });
}
