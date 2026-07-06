import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const conversa = await prisma.iaConversa.findFirst({
    where: { id, usuarioId: session.user.id },
  });

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(conversa);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const conversa = await prisma.iaConversa.findFirst({
    where: { id, usuarioId: session.user.id },
  });

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  await prisma.iaMensagem.deleteMany({ where: { conversaId: id } });
  await prisma.iaConversa.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
