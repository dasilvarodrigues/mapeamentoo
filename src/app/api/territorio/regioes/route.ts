import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const regioes = await prisma.regiao.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(regioes);
}
