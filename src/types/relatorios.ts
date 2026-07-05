export type TipoRelatorio =
  | "geral"
  | "localidade"
  | "tipo"
  | "responsaveis"
  | "cobertura"
  | "crm"
  | "customizado";

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  regiaoId?: string;
  bairroId?: string;
  tipo?: string;
  status?: string;
  responsavel?: string;
}

export interface RelatorioCustomizadoParams extends FiltrosRelatorio {
  metricas: string[];
  agruparPor: "nenhum" | "bairro" | "tipo" | "responsavel" | "mes";
}

export interface KpiGeral {
  label: string;
  value: number;
  variacao?: number;
}

export interface DadoGrafico {
  nome: string;
  valor: number;
  cor?: string;
}

export interface DadoSerie {
  mes: string;
  abertas: number;
  resolvidas: number;
}

export interface DadoLinha {
  label: string;
  total: number;
  resolvidas: number;
  pendentes: number;
}

export interface DadoCobertura {
  regiao: string;
  bairros: {
    nome: string;
    totalDemandas: number;
    comunidades: number;
  }[];
}

export interface DadoInteracao {
  data: string;
  tipo: string;
  descricao: string;
  contato: string;
  responsavel: string;
}

export interface RelatorioGeral {
  kpis: KpiGeral[];
  evolucaoMensal: DadoSerie[];
}

export interface RelatorioLocalidade {
  bairros: DadoGrafico[];
  tabela: { bairro: string; total: number }[];
}

export interface RelatorioTipo {
  distribuicao: DadoGrafico[];
  tabela: { tipo: string; total: number; percentual: string }[];
}

export interface RelatorioResponsaveis {
  ranking: DadoLinha[];
}

export interface RelatorioCobertura {
  dados: DadoCobertura[];
}

export interface RelatorioCRM {
  interacoes: DadoInteracao[];
  contatosAtivos: number;
  interacoesPorMes: DadoGrafico[];
}

export type DadosRelatorio =
  | RelatorioGeral
  | RelatorioLocalidade
  | RelatorioTipo
  | RelatorioResponsaveis
  | RelatorioCobertura
  | RelatorioCRM
  | Record<string, unknown>;
