export interface AnexoType {
  id: string;
  nomeOriginal: string;
  nomeArquivo: string;
  tamanho: number;
  mimeType: string;
  entidadeTipo: "demanda" | "contato" | "interacao";
  entidadeId: string;
  criadoPor: string | null;
  createdAt: string;
}

export type EntidadeTipo = AnexoType["entidadeTipo"];
