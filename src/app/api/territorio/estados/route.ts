import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const estados = await prisma.estado.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(estados);
}
