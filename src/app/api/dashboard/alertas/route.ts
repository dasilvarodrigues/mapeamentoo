import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";

const categorias = [
  "iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento",
];
const regioes = [
  "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro", "Rural",
];

function gerarEvento() {
  const tipos = ["nova_demanda", "status_alterado", "visita_registrada"];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const regiao = regioes[Math.floor(Math.random() * regioes.length)];
  const categoria = categorias[Math.floor(Math.random() * categorias.length)];

  const mensagens: Record<string, string> = {
    nova_demanda: `Nova demanda de ${categoria} registrada em ${regiao}`,
    status_alterado: `Demanda de ${categoria} em ${regiao} teve status alterado`,
    visita_registrada: `Visita técnica agendada em ${regiao}`,
  };

  return {
    id: crypto.randomUUID(),
    tipo,
    mensagem: mensagens[tipo],
    regiao,
    timestamp: new Date().toISOString(),
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = () => {
        const evento = gerarEvento();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(evento)}\n\n`)
        );
      };

      sendEvent();
      const interval = setInterval(sendEvent, 15000);

      const cleanup = () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      };

      const abortHandler = () => {
        cleanup();
        globalThis.removeEventListener?.("abort", abortHandler);
      };

      globalThis.addEventListener?.("abort", abortHandler);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
