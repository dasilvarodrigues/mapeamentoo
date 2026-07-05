import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { readFile, unlink } from "fs/promises";
import { join } from "path";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caminho = join(process.cwd(), "uploads",
    anexo.createdAt.getFullYear().toString(),
    String(anexo.createdAt.getMonth() + 1).padStart(2, "0"),
    anexo.nomeArquivo,
  );

  try {
    const buffer = await readFile(caminho);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": anexo.mimeType,
        "Content-Disposition": `inline; filename="${anexo.nomeOriginal}"`,
        "Content-Length": String(anexo.tamanho),
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no disco" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "agente" && anexo.criadoPor !== session.user.nome && anexo.criadoPor !== session.user.email) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const caminho = join(process.cwd(), "uploads",
    anexo.createdAt.getFullYear().toString(),
    String(anexo.createdAt.getMonth() + 1).padStart(2, "0"),
    anexo.nomeArquivo,
  );

  await Promise.all([
    prisma.anexo.delete({ where: { id } }),
    unlink(caminho).catch(() => {}),
  ]);

  return new NextResponse(null, { status: 204 });
}
