import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { reindexarTudo } from "@/lib/ia/indexador";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  try {
    await reindexarTudo();
    return NextResponse.json({ success: true, message: "Índice reindexado com sucesso" });
  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json(
      { error: "Erro ao reindexar" },
      { status: 500 }
    );
  }
}
