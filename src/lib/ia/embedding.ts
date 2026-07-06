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
