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
