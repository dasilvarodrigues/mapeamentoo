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
