export interface ContatoType {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cargo: string | null;
  redesSociais: Record<string, string> | null;
  bairroId: string | null;
  comunidadeId: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InteracaoType {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
  responsavel: string;
  contatoId: string;
  demandaId: string | null;
  createdAt: string;
}

export interface ContatoFormData {
  nome: string;
  telefone: string;
  email?: string;
  cargo?: string;
  redesSociais?: string;
  bairroId?: string;
  comunidadeId?: string;
  observacoes?: string;
}

export interface InteracaoFormData {
  tipo: string;
  descricao: string;
  data: string;
  responsavel: string;
  contatoId: string;
  demandaId?: string;
}
