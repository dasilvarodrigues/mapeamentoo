import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  const conversas = await prisma.iaConversa.findMany({
    where: { usuarioId: session.user.id },
    include: {
      _count: { select: { mensagens: true } },
      mensagens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = conversas.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    ultimaMensagem: c.mensagens[0]?.conteudo?.slice(0, 100) ?? null,
    totalMensagens: c._count.mensagens,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}
