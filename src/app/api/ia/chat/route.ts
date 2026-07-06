import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { gerarEmbedding } from "@/lib/ia/embedding";
import { chatCompletion } from "@/lib/ia/llm";
import { montarPrompt } from "@/lib/ia/prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { conversaId, mensagem } = await request.json();

    if (!mensagem || typeof mensagem !== "string" || mensagem.trim().length === 0) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
    }

    const mensagemTruncada = mensagem.trim().slice(0, 4000);

    // 1. Buscar ou criar conversa
    let conversa = conversaId
      ? await prisma.iaConversa.findFirst({
          where: { id: conversaId, usuarioId: session.user.id },
          include: { mensagens: { orderBy: { createdAt: "asc" }, take: 20 } },
        })
      : null;

    if (!conversa) {
      conversa = await prisma.iaConversa.create({
        data: {
          usuarioId: session.user.id,
          titulo: mensagemTruncada.slice(0, 80),
        },
        include: { mensagens: { orderBy: { createdAt: "asc" }, take: 0 } },
      });
    }

    // 2. Salvar mensagem do usuário
    await prisma.iaMensagem.create({
      data: {
        conversaId: conversa.id,
        papel: "user",
        conteudo: mensagemTruncada,
      },
    });

    // 3. Gerar embedding e buscar chunks
    let chunks: { id: string; conteudo: string }[] = [];
    try {
      const embedding = await gerarEmbedding(mensagemTruncada);
      const embeddingStr = `[${embedding.join(",")}]`;
      const resultados = await prisma.$queryRawUnsafe<{ id: string; conteudo: string }[]>(
        `SELECT id, conteudo FROM "IaChunk"
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        embeddingStr
      );
      chunks = resultados;
    } catch (err) {
      console.error("Embedding/busca error:", err);
      // segue sem chunks
    }

    // 4. Montar histórico
    const historico = (conversa.mensagens || []).map((m) => ({
      papel: m.papel as "user" | "assistant",
      conteudo: m.conteudo,
    }));

    // 5. Montar prompt
    const messages = montarPrompt({
      chunks: chunks.map((c) => c.conteudo),
      historico,
      pergunta: mensagemTruncada,
    });

    // 6. Criar stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          await chatCompletion(messages, (token) => {
            fullResponse += token;
            const data = JSON.stringify({ token, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
          console.error("Chat error:", errorMsg);
          const data = JSON.stringify({
            token: "Desculpe, o assistente está temporariamente indisponível. Tente novamente em alguns instantes.",
            done: true,
            conversaId: conversa!.id,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
          return;
        }

        // Salvar resposta
        try {
          await prisma.iaMensagem.create({
            data: {
              conversaId: conversa!.id,
              papel: "assistant",
              conteudo: fullResponse,
              chunksFonte: chunks.map((c) => c.id),
            },
          });
        } catch (err) {
          console.error("Erro ao salvar resposta:", err);
        }

        const doneData = JSON.stringify({
          token: "",
          done: true,
          conversaId: conversa!.id,
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
