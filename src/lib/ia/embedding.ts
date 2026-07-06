const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function ollamaEmbedding(texto: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto,
    }),
  });
  if (!res.ok) throw new Error(`Ollama embedding error: ${res.status}`);
  const data = await res.json();
  return data.embedding as number[];
}

async function openaiEmbedding(texto: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texto,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embedding error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const errors: string[] = [];
  try {
    return await ollamaEmbedding(texto);
  } catch (err) {
    errors.push(`Ollama: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    return await openaiEmbedding(texto);
  } catch (err) {
    errors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`);
  }
  throw new Error(`All embedding providers failed: ${errors.join("; ")}`);
}

export async function gerarEmbeddings(textos: string[]): Promise<number[][]> {
  return Promise.all(textos.map(gerarEmbedding));
}
