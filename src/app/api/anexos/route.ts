import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ENTIDADES_VALIDAS = ["demanda", "contato", "interacao"] as const;

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const entidadeTipo = searchParams.get("entidadeTipo");
  const entidadeId = searchParams.get("entidadeId");

  if (!entidadeTipo || !entidadeId) {
    return NextResponse.json({ error: "entidadeTipo e entidadeId são obrigatórios" }, { status: 400 });
  }

  const anexos = await prisma.anexo.findMany({
    where: { entidadeTipo, entidadeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nomeOriginal: true,
      tamanho: true,
      mimeType: true,
      criadoPor: true,
      createdAt: true,
    },
  });

  return NextResponse.json(anexos);
}

export async function POST(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;
  const entidadeTipo = formData.get("entidadeTipo") as string;
  const entidadeId = formData.get("entidadeId") as string;

  if (!arquivo || !entidadeTipo || !entidadeId) {
    return NextResponse.json({ error: "arquivo, entidadeTipo e entidadeId são obrigatórios" }, { status: 400 });
  }

  if (!ENTIDADES_VALIDAS.includes(entidadeTipo as typeof ENTIDADES_VALIDAS[number])) {
    return NextResponse.json({ error: "entidadeTipo inválida" }, { status: 400 });
  }

  if (arquivo.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo excede 2MB" }, { status: 413 });
  }

  const extension = arquivo.name.split(".").pop() || "bin";
  const nomeArquivo = `${randomUUID()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const agora = new Date();
  const caminhoPasta = join(process.cwd(), "uploads", String(agora.getFullYear()), String(agora.getMonth() + 1).padStart(2, "0"));
  const caminhoCompleto = join(caminhoPasta, nomeArquivo);

  await mkdir(caminhoPasta, { recursive: true });
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(caminhoCompleto, buffer);

  const anexo = await prisma.anexo.create({
    data: {
      nomeOriginal: arquivo.name,
      nomeArquivo,
      tamanho: arquivo.size,
      mimeType: arquivo.type,
      entidadeTipo,
      entidadeId,
      criadoPor: session.user.nome || session.user.email,
    },
  });

  return NextResponse.json({
    id: anexo.id,
    nomeOriginal: anexo.nomeOriginal,
    nomeArquivo: anexo.nomeArquivo,
    tamanho: anexo.tamanho,
    mimeType: anexo.mimeType,
    createdAt: anexo.createdAt,
  }, { status: 201 });
}
