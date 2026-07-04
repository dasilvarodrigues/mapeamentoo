export interface DashboardKPIs {
  totalRegioes: number;
  totalBairros: number;
  totalComunidades: number;
  totalRegistros: number;
  demandasAbertas: number;
  demandasResolvidas: number;
  totalVisitas: number;
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "Point";
    coordinates: number[][][] | number[];
  };
  properties: {
    id: string;
    nome: string;
    totalDemandas: number;
    categoria?: string;
    status?: string;
  };
}

export interface GraficoData {
  meses: { mes: string; total: number; resolvidas: number }[];
  categorias: { nome: string; total: number }[];
}

export interface RankingItem {
  regiao: string;
  total: number;
  abertas: number;
  resolvidas: number;
  percentual: number;
}

export interface TimelineItem {
  id: string;
  tipo: "demanda" | "visita" | "alerta";
  descricao: string;
  data: string;
}

export interface AlertaEvento {
  id: string;
  tipo: string;
  mensagem: string;
  regiao: string;
  timestamp: string;
}
