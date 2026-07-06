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
