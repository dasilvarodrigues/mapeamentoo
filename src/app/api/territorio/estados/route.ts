import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const estados = await prisma.estado.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(estados);
}
