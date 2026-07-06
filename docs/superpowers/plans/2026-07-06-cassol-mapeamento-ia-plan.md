# Módulo de Inteligência Artificial (RAG + Chat) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar assistente RAG com chat via widget flutuante global usando pgvector + Ollama (fallback OpenAI).

**Architecture:** Chunks textuais pré-processados com embeddings armazenados em pgvector. Busca semântica na pergunta do usuário para recuperar contexto, enviado junto com a pergunta para o LLM. Streaming via SSE. Widget React fixo no layout raiz.

**Tech Stack:** Next.js 16 App Router, Prisma 7, pgvector, Ollama (nomic-embed-text + modelo chat), OpenAI (fallback chat), SSE.

---

### Task 1: Modelos Prisma (IaChunk, IaConversa, IaMensagem)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Adicionar modelos IaChunk, IaConversa, IaMensagem ao schema**

Inserir após o modelo `Visita`, antes do modelo `User`:

```prisma
model IaChunk {
  id           String   @id @default(cuid())
  conteudo     String   @db.Text
  metadata     Json     @default("{}")
  embedding    Unsupported("vector(384)")?
  fonte        String
  createdAt    DateTime @default(now())
  atualizado_em DateTime @updatedAt
}

model IaConversa {
  id          String   @id @default(cuid())
  usuarioId   String
  usuario     User     @relation(fields: [usuarioId], references: [id])
  titulo      String   @default("Nova conversa")
  createdAt   DateTime @default(now())
  atualizado_em DateTime @updatedAt

  mensagens   IaMensagem[]
}

model IaMensagem {
  id          String   @id @default(cuid())
  conversaId  String
  conversa    IaConversa @relation(fields: [conversaId], references: [id])
  papel       String   // "user" | "assistant"
  conteudo    String   @db.Text
  chunksFonte Json?
  createdAt   DateTime @default(now())
}
```

- [ ] **Gerar migration e compilar client**

```bash
cd /var/www/html/mapeamento
npx prisma migrate dev --name add_ia_models
npx prisma generate
```

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add IA models (IaChunk, IaConversa, IaMensagem)"
```

---

### Task 2: Tipos TypeScript (IA)

**Files:**
- Create: `src/types/ia.ts`

- [ ] **Criar tipos do módulo IA**

```ts
export interface IaChunkType {
  id: string;
  conteudo: string;
  metadata: Record<string, unknown>;
  fonte: "kpi" | "demanda" | "territorio" | "crm";
  createdAt: string;
}

export interface IaConversaType {
  id: string;
  usuarioId: string;
  titulo: string;
  ultimaMensagem?: string;
  totalMensagens: number;
  createdAt: string;
}

export interface IaMensagemType {
  id: string;
  conversaId: string;
  papel: "user" | "assistant";
  conteudo: string;
  chunksFonte: string[] | null;
  createdAt: string;
}

export interface ChatRequest {
  conversaId?: string;
  mensagem: string;
}

export interface ChatStreamToken {
  token: string;
  done: boolean;
  conversaId?: string;
}

export interface IaErrorResponse {
  error: string;
}
```

- [ ] **Commit**

```bash
git add src/types/ia.ts
git commit -m "feat: add IA types"
```

---

### Task 3: Serviço LLM (Ollama + OpenAI fallback)

**Files:**
- Create: `src/lib/ia/llm.ts`

- [ ] **Criar serviço de LLM com fallback**

```ts
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMResponse {
  content: string;
  model: string;
}

async function ollamaChat(
  messages: LLMMessage[],
  onToken?: (token: string) => void
): Promise<LLMResponse> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: !!onToken,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  if (!onToken) {
    const data = await res.json();
    return { content: data.message.content, model: `ollama/${OLLAMA_MODEL}` };
  }

  let fullContent = "";
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.message?.content) {
          fullContent += data.message.content;
          onToken(data.message.content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return { content: fullContent, model: `ollama/${OLLAMA_MODEL}` };
}

async function openaiChat(
  messages: LLMMessage[],
  onToken?: (token: string) => void
): Promise<LLMResponse> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      stream: !!onToken,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

  if (!onToken) {
    const data = await res.json();
    return { content: data.choices[0].message.content, model: `openai/${OPENAI_MODEL}` };
  }

  let fullContent = "";
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") break;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          fullContent += token;
          onToken(token);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return { content: fullContent, model: `openai/${OPENAI_MODEL}` };
}

export async function chatCompletion(
  messages: LLMMessage[],
  onToken?: (token: string) => void
): Promise<LLMResponse> {
  const errors: string[] = [];

  try {
    return await ollamaChat(messages, onToken);
  } catch (err) {
    errors.push(`Ollama: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    return await openaiChat(messages, onToken);
  } catch (err) {
    errors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error(`All LLM providers failed: ${errors.join("; ")}`);
}
```

- [ ] **Commit**

```bash
git add src/lib/ia/llm.ts
git commit -m "feat: add LLM service with Ollama and OpenAI fallback"
```

---

### Task 4: Serviço de Embeddings

**Files:**
- Create: `src/lib/ia/embedding.ts`

- [ ] **Criar serviço de embeddings (Ollama nomic-embed-text)**

```ts
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto,
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.embedding as number[];
}

export async function gerarEmbeddings(textos: string[]): Promise<number[][]> {
  return Promise.all(textos.map(gerarEmbedding));
}
```

- [ ] **Commit**

```bash
git add src/lib/ia/embedding.ts
git commit -m "feat: add embedding service (Ollama nomic-embed-text)"
```

---

### Task 5: Serviço de Prompt

**Files:**
- Create: `src/lib/ia/prompt.ts`

- [ ] **Criar construção de prompt com contexto**

```ts
interface MontarPromptParams {
  chunks: string[];
  historico: { papel: "user" | "assistant"; conteudo: string }[];
  pergunta: string;
}

const SYSTEM_PROMPT = `Você é um assistente especializado no sistema Cassol Mapeamento Regional.
Responda APENAS com base nas informações fornecidas abaixo.
Se a informação não estiver disponível, diga que não encontrou dados suficientes.
Seja conciso e objetivo. Use português brasileiro.`;

export function montarPrompt({ chunks, historico, pergunta }: MontarPromptParams) {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (chunks.length > 0) {
    messages.push({
      role: "system",
      content: `INFORMAÇÕES DO SISTEMA:\n${chunks.join("\n\n")}`,
    });
  }

  for (const msg of historico.slice(-10)) {
    messages.push({ role: msg.papel, content: msg.conteudo });
  }

  messages.push({ role: "user", content: pergunta });

  return messages;
}
```

- [ ] **Commit**

```bash
git add src/lib/ia/prompt.ts
git commit -m "feat: add prompt builder with RAG context"
```

---

### Task 6: Indexador (Pipeline de Chunks)

**Files:**
- Create: `src/lib/ia/indexador.ts`

- [ ] **Criar pipeline de indexação**

```ts
import { prisma } from "@/lib/prisma";
import { gerarEmbedding } from "./embedding";

async function criarChunk(
  conteudo: string,
  metadata: Record<string, unknown>,
  fonte: string
) {
  const embedding = await gerarEmbedding(conteudo);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "IaChunk" (id, conteudo, metadata, embedding, fonte, createdAt, atualizado_em)
     VALUES ($1, $2, $3::jsonb, $4::vector, $5, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       conteudo = EXCLUDED.conteudo,
       metadata = EXCLUDED.metadata,
       embedding = EXCLUDED.embedding,
       fonte = EXCLUDED.fonte,
       atualizado_em = NOW()`,
    crypto.randomUUID(),
    conteudo,
    JSON.stringify(metadata),
    `[${embedding.join(",")}]`,
    fonte
  );
}

export async function reindexarTudo() {
  await prisma.$executeRawUnsafe(`TRUNCATE "IaChunk"`);

  // 1. KPI — resumo geral
  const [totalRegioes, totalBairros, totalComunidades, demandas, totalVisitas, totalContatos] =
    await Promise.all([
      prisma.regiao.count(),
      prisma.bairro.count(),
      prisma.comunidade.count(),
      prisma.demanda.groupBy({ by: ["status"], _count: true }),
      prisma.visita.count(),
      prisma.contato.count(),
    ]);

  const demandasAbertas = demandas.find((d) => d.status === "aberta")?._count ?? 0;
  const demandasAndamento = demandas.find((d) => d.status === "em_andamento")?._count ?? 0;
  const demandasResolvidas = demandas.find((d) => d.status === "resolvida")?._count ?? 0;

  await criarChunk(
    `O sistema possui ${totalRegioes} regiões, ${totalBairros} bairros, ${totalComunidades} comunidades. ` +
    `Total de demandas: ${demandasAbertas + demandasAndamento + demandasResolvidas} ` +
    `(${demandasAbertas + demandasAndamento} abertas/em andamento, ${demandasResolvidas} resolvidas). ` +
    `Total de visitas: ${totalVisitas}. Total de contatos no CRM: ${totalContatos}.`,
    { tipo: "resumo_geral" },
    "kpi"
  );

  // 2. Demandas por região
  const demandasPorRegiao = await prisma.regiao.findMany({
    include: {
      _count: { select: { demandas: true } },
      demandas: { select: { status: true, tipo: true } },
    },
  });

  for (const regiao of demandasPorRegiao) {
    if (regiao._count.demandas === 0) continue;
    const porStatus: Record<string, number> = {};
    for (const d of regiao.demandas) {
      porStatus[d.status] = (porStatus[d.status] || 0) + 1;
    }
    const resumoStatus = Object.entries(porStatus)
      .map(([s, n]) => `${n} ${s}`)
      .join(", ");
    await criarChunk(
      `Na região ${regiao.nome} (${regiao.municipio}/${regiao.uf}) há ${regiao._count.demandas} demandas. Status: ${resumoStatus}.`,
      { tipo: "demanda", regiao: regiao.nome, municipio: regiao.municipio },
      "demanda"
    );
  }

  // 3. Território — hierarquia
  const estados = await prisma.estado.findMany({
    include: {
      municipios: {
        include: {
          bairros: { select: { _count: { select: { comunidades: true } } } },
        },
      },
    },
  });

  for (const estado of estados) {
    for (const municipio of estado.municipios) {
      const totalBairrosMunicipio = municipio.bairros.length;
      const totalComunidadesMunicipio = municipio.bairros.reduce(
        (acc, b) => acc + b._count.comunidades, 0
      );
      await criarChunk(
        `O município de ${municipio.nome} (${estado.uf}, ${estado.nome}) possui ${totalBairrosMunicipio} bairros e ${totalComunidadesMunicipio} comunidades.`,
        { tipo: "territorio", uf: estado.uf, municipio: municipio.nome },
        "territorio"
      );
    }
  }

  // 4. CRM — resumo de contatos
  const contatosPorBairro = await prisma.contato.groupBy({
    by: ["bairroId"],
    _count: true,
  });

  const bairrosComContatos = await prisma.bairro.findMany({
    where: { id: { in: contatosPorBairro.map((c) => c.bairroId).filter(Boolean) as string[] } },
    select: { id: true, nome: true, regiao: { select: { nome: true } } },
  });

  const bairroMap = new Map(bairrosComContatos.map((b) => [b.id, b]));
  const topBairros = contatosPorBairro
    .filter((c) => c.bairroId && bairroMap.get(c.bairroId))
    .sort((a, b) => b._count - a._count)
    .slice(0, 10);

  if (topBairros.length > 0) {
    await criarChunk(
      `Top bairros com mais contatos no CRM: ${topBairros
        .map((c) => `${bairroMap.get(c.bairroId)!.nome} (${c._count})`)
        .join(", ")}. Total de contatos: ${totalContatos}.`,
      { tipo: "crm_resumo" },
      "crm"
    );
  }
}
```

- [ ] **Commit**

```bash
git add src/lib/ia/indexador.ts
git commit -m "feat: add indexing pipeline for RAG chunks"
```

---

### Task 7: API de Chat (POST /api/ia/chat com SSE)

**Files:**
- Create: `src/app/api/ia/chat/route.ts`

- [ ] **Criar rota de chat com SSE streaming**

```ts
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
          titulo: mensagem.slice(0, 80),
        },
        include: { mensagens: { orderBy: { createdAt: "asc" }, take: 0 } },
      });
    }

    // 2. Salvar mensagem do usuário
    await prisma.iaMensagem.create({
      data: {
        conversaId: conversa.id,
        papel: "user",
        conteudo: mensagem,
      },
    });

    // 3. Gerar embedding e buscar chunks
    let chunks: { conteudo: string; id: string }[] = [];
    try {
      const embedding = await gerarEmbedding(mensagem);
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
      pergunta: mensagem,
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
          fullResponse = "Desculpe, o assistente está temporariamente indisponível. Tente novamente em alguns instantes.";
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
```

- [ ] **Commit**

```bash
git add src/app/api/ia/chat/route.ts
git commit -m "feat: add chat API with SSE streaming"
```

---

### Task 8: API de Conversas (GET, DELETE)

**Files:**
- Create: `src/app/api/ia/conversas/route.ts`
- Create: `src/app/api/ia/conversas/[id]/route.ts`
- Create: `src/app/api/ia/conversas/[id]/mensagens/route.ts`

- [ ] **Criar GET /api/ia/conversas (listar conversas do usuário)**

```ts
// src/app/api/ia/conversas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  const conversas = await prisma.iaConversa.findMany({
    where: { usuarioId: session.user.id },
    include: {
      _count: { select: { mensagens: true } },
      mensagens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { atualizado_em: "desc" },
  });

  const data = conversas.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    ultimaMensagem: c.mensagens[0]?.conteudo?.slice(0, 100) ?? null,
    totalMensagens: c._count.mensagens,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}
```

- [ ] **Criar GET + DELETE /api/ia/conversas/[id]**

```ts
// src/app/api/ia/conversas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const conversa = await prisma.iaConversa.findFirst({
    where: { id, usuarioId: session.user.id },
  });

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(conversa);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const conversa = await prisma.iaConversa.findFirst({
    where: { id, usuarioId: session.user.id },
  });

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  await prisma.iaMensagem.deleteMany({ where: { conversaId: id } });
  await prisma.iaConversa.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Criar GET /api/ia/conversas/[id]/mensagens**

```ts
// src/app/api/ia/conversas/[id]/mensagens/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const conversa = await prisma.iaConversa.findFirst({
    where: { id, usuarioId: session.user.id },
  });

  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  const mensagens = await prisma.iaMensagem.findMany({
    where: { conversaId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: mensagens });
}
```

- [ ] **Commit**

```bash
git add src/app/api/ia/conversas/
git commit -m "feat: add conversations API (list, detail, delete, messages)"
```

---

### Task 9: API de Reindexação

**Files:**
- Create: `src/app/api/ia/reindexar/route.ts`

- [ ] **Criar POST /api/ia/reindexar (admin)**

```ts
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
```

- [ ] **Commit**

```bash
git add src/app/api/ia/reindexar/route.ts
git commit -m "feat: add reindex API (admin only)"
```

---

### Task 10: Componente ChatSkeleton

**Files:**
- Create: `src/components/ia/ChatSkeleton.tsx`

- [ ] **Criar skeleton animado para loading**

```tsx
// src/components/ia/ChatSkeleton.tsx
export function ChatSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        IA
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatSkeleton.tsx
git commit -m "feat: add ChatSkeleton component"
```

---

### Task 11: Componente ChatMessage

**Files:**
- Create: `src/components/ia/ChatMessage.tsx`

- [ ] **Criar componente de bolha de mensagem**

```tsx
// src/components/ia/ChatMessage.tsx
"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  papel: "user" | "assistant";
  conteudo: string;
  isStreaming?: boolean;
}

export function ChatMessage({ papel, conteudo, isStreaming }: ChatMessageProps) {
  const isUser = papel === "user";

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-blue-500"
        )}
      >
        {isUser ? "U" : "IA"}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        )}
      >
        {conteudo}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatMessage.tsx
git commit -m "feat: add ChatMessage component"
```

---

### Task 12: Componente ChatInput

**Files:**
- Create: `src/components/ia/ChatInput.tsx`

- [ ] **Criar componente de input de mensagem**

```tsx
// src/components/ia/ChatInput.tsx
"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (mensagem: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Digite sua pergunta..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shrink-0"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatInput.tsx
git commit -m "feat: add ChatInput component"
```

---

### Task 13: Componente ChatHistory

**Files:**
- Create: `src/components/ia/ChatHistory.tsx`

- [ ] **Criar componente de histórico de conversas**

```tsx
// src/components/ia/ChatHistory.tsx
"use client";

import { MessageSquare, Trash2, Plus } from "lucide-react";
import type { IaConversaType } from "@/types/ia";
import { formatDateTime } from "@/lib/utils";

interface ChatHistoryProps {
  conversas: IaConversaType[];
  conversaAtiva?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
}

export function ChatHistory({
  conversas,
  conversaAtiva,
  onSelect,
  onDelete,
  onNew,
  loading,
}: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Histórico</h3>
        <button
          onClick={onNew}
          className="p-1.5 rounded-lg hover:bg-muted transition"
          title="Nova conversa"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Carregando...
          </div>
        ) : conversas.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Nenhuma conversa ainda
          </div>
        ) : (
          conversas.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-muted transition text-sm ${
                c.id === conversaAtiva ? "bg-muted" : ""
              }`}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.titulo}</div>
                {c.ultimaMensagem && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.ultimaMensagem}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDateTime(c.createdAt)} · {c.totalMensagens} msgs
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatHistory.tsx
git commit -m "feat: add ChatHistory component"
```

---

### Task 14: Componente ChatDrawer

**Files:**
- Create: `src/components/ia/ChatDrawer.tsx`

- [ ] **Criar drawer lateral do chat**

```tsx
// src/components/ia/ChatDrawer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, History, MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSkeleton } from "./ChatSkeleton";
import { ChatHistory } from "./ChatHistory";
import type { IaConversaType, IaMensagemType, ChatStreamToken } from "@/types/ia";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ChatState = "empty" | "loading" | "streaming" | "complete" | "error";

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const [state, setState] = useState<ChatState>("empty");
  const [conversaId, setConversaId] = useState<string | undefined>();
  const [mensagens, setMensagens] = useState<IaMensagemType[]>([]);
  const [respostaAtual, setRespostaAtual] = useState("");
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [conversas, setConversas] = useState<IaConversaType[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const mensagensRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      mensagensRef.current?.scrollTo({ top: mensagensRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, respostaAtual]);

  const carregarConversas = useCallback(async () => {
    setHistoricoLoading(true);
    try {
      const res = await fetch("/api/ia/conversas");
      const json = await res.json();
      setConversas(json.data || []);
    } catch {
      // silent
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  const carregarMensagens = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ia/conversas/${id}/mensagens`);
      const json = await res.json();
      setMensagens(json.data || []);
      setConversaId(id);
      setState(json.data.length > 0 ? "complete" : "empty");
    } catch {
      setState("error");
    }
  }, []);

  const handleSend = async (mensagem: string) => {
    setState("loading");
    setErrorMsg("");
    setRespostaAtual("");

    const userMsg: IaMensagemType = {
      id: crypto.randomUUID(),
      conversaId: conversaId || "",
      papel: "user",
      conteudo: mensagem,
      chunksFonte: null,
      createdAt: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversaId, mensagem }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao conectar" }));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      setState("streaming");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Sem resposta do servidor");

      const decoder = new TextDecoder();
      let buffer = "";
      let novaConversaId = conversaId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data: ChatStreamToken = JSON.parse(line.slice(6));
            if (data.conversaId) novaConversaId = data.conversaId;
            if (data.done) {
              setConversaId(novaConversaId);
              setRespostaAtual("");
              setMensagens((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  conversaId: novaConversaId || "",
                  papel: "assistant",
                  conteudo: data.token || respostaAtual,
                  chunksFonte: null,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setState("complete");
              carregarConversas();
            } else {
              setRespostaAtual((prev) => prev + data.token);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMsg(msg);
      setState("error");
    } finally {
      scrollToBottom();
    }
  };

  const handleSelectConversa = (id: string) => {
    setMostrarHistorico(false);
    carregarMensagens(id);
  };

  const handleDeleteConversa = async (id: string) => {
    try {
      await fetch(`/api/ia/conversas/${id}`, { method: "DELETE" });
      if (conversaId === id) {
        setConversaId(undefined);
        setMensagens([]);
        setState("empty");
      }
      carregarConversas();
    } catch {
      // silent
    }
  };

  const handleNovaConversa = () => {
    setConversaId(undefined);
    setMensagens([]);
    setState("empty");
    setRespostaAtual("");
    setErrorMsg("");
  };

  const sugestoes = [
    "Quantas regiões o sistema possui?",
    "Quais bairros têm mais demandas abertas?",
    "Resumo executivo do território",
    "Top 10 bairros com mais contatos no CRM",
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              IA
            </div>
            <span className="font-semibold text-sm">Assistente IA</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMostrarHistorico(!mostrarHistorico);
                if (!mostrarHistorico) carregarConversas();
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition"
              title="Histórico"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={mensagensRef} className="flex-1 overflow-y-auto">
              {state === "empty" && mensagens.length === 0 && (
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mx-auto mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold">Olá! Como posso ajudar?</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faça perguntas sobre regiões, demandas, território e CRM
                    </p>
                  </div>
                  <div className="space-y-2">
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="w-full text-left text-xs p-2.5 rounded-xl border hover:bg-muted transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensagens.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  papel={msg.papel}
                  conteudo={msg.conteudo}
                />
              ))}

              {(state === "loading" || state === "streaming") && (
                <>
                  {respostaAtual ? (
                    <ChatMessage papel="assistant" conteudo={respostaAtual} isStreaming={state === "streaming"} />
                  ) : (
                    <ChatSkeleton />
                  )}
                </>
              )}

              {state === "error" && !respostaAtual && (
                <div className="px-4 py-3">
                  <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium">Erro</p>
                    <p className="text-xs mt-1">{errorMsg}</p>
                    <button
                      onClick={() => setState("empty")}
                      className="mt-2 text-xs underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ChatInput onSend={handleSend} disabled={state === "loading" || state === "streaming"} />
          </div>

          {/* Sidebar historico */}
          {mostrarHistorico && (
            <div className="w-56 border-l bg-muted/30 flex-shrink-0">
              <ChatHistory
                conversas={conversas}
                conversaAtiva={conversaId}
                onSelect={handleSelectConversa}
                onDelete={handleDeleteConversa}
                onNew={handleNovaConversa}
                loading={historicoLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatDrawer.tsx
git commit -m "feat: add ChatDrawer component"
```

---

### Task 15: Componente ChatWidget (botão flutuante)

**Files:**
- Create: `src/components/ia/ChatWidget.tsx`

- [ ] **Criar botão flutuante do chat**

```tsx
// src/components/ia/ChatWidget.tsx
"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatDrawer } from "./ChatDrawer";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        title="Assistente IA"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      <ChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ia/ChatWidget.tsx
git commit -m "feat: add ChatWidget floating button"
```

---

### Task 16: Integrar Widget no Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Adicionar ChatWidget ao root layout**

```tsx
// src/app/layout.tsx — adicionar import e componente
import { ChatWidget } from "@/components/ia/ChatWidget";

// Dentro do body, após </Providers>:
<Providers>
  {children}
  <ChatWidget />
</Providers>
```

- [ ] **Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: integrate ChatWidget into root layout"
```

---

### Task 17: Verificar Build

- [ ] **Buildar e verificar erros**

```bash
cd /var/www/html/mapeamento
npx prisma generate
npm run build
```

Corrigir eventuais erros de tipo ou import.

- [ ] **Commit final (se necessário)**

```bash
git add -A
git commit -m "fix: build adjustments"
```
