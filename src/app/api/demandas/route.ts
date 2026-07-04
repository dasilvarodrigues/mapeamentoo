import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const status = searchParams.get("status");
  const categoria = searchParams.get("categoria");
  const regiaoId = searchParams.get("regiaoId");
  const busca = searchParams.get("busca");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categoria) where.categoria = categoria;
  if (regiaoId) where.regiaoId = regiaoId;
  if (busca) where.descricao = { contains: busca, mode: "insensitive" };

  const [demandas, total] = await Promise.all([
    prisma.demanda.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.demanda.count({ where }),
  ]);

  return NextResponse.json({
    demandas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  const demanda = await prisma.demanda.create({
    data: {
      categoria: data.categoria,
      descricao: data.descricao,
      tipo: data.tipo || "rotina",
      status: data.status || "aberta",
      prioridade: data.prioridade || 0,
      responsavel: data.responsavel || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      regiaoId: data.regiaoId || null,
      bairroId: data.bairroId || null,
    },
  });
  return NextResponse.json(demanda, { status: 201 });
}
