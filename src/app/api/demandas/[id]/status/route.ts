import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  if (session.user.role === "agente") {
    const demanda = await prisma.demanda.findUnique({ where: { id } });
    if (!demanda || demanda.responsavel !== session.user.nome) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }
  const { status } = await request.json();
  const resolvedAt = status === "resolvida" ? new Date() : null;
  const demanda = await prisma.demanda.update({
    where: { id },
    data: { status, resolvedAt },
  });
  return NextResponse.json(demanda);
}
