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

  const mensagens = await prisma.iaMensagem.findMany({
    where: { conversaId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: mensagens });
}
