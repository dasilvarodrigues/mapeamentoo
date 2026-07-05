import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const demanda = await prisma.demanda.findUnique({ where: { id } });
  if (!demanda) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(demanda);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const data = await request.json();
  const demanda = await prisma.demanda.update({
    where: { id },
    data: {
      categoria: data.categoria,
      descricao: data.descricao,
      tipo: data.tipo,
      status: data.status,
      prioridade: data.prioridade,
      responsavel: data.responsavel,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      regiaoId: data.regiaoId ?? null,
      bairroId: data.bairroId ?? null,
      resolvedAt: data.status === "resolvida" ? new Date() : data.resolvedAt ?? null,
    },
  });
  return NextResponse.json(demanda);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  await prisma.demanda.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
