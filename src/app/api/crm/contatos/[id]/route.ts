import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contato = await prisma.contato.findUnique({
    where: { id },
    include: { interacoes: { orderBy: { data: "desc" } } },
  });
  if (!contato) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contato);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const contato = await prisma.contato.update({
    where: { id },
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
  return NextResponse.json(contato);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contato.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
