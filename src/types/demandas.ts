export interface DemandaType {
  id: string;
  categoria: string;
  descricao: string;
  tipo: string;
  status: string;
  prioridade: number;
  responsavel: string | null;
  latitude: number | null;
  longitude: number | null;
  regiaoId: string | null;
  bairroId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface DemandaListResponse {
  demandas: DemandaType[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DemandaFormData {
  categoria: string;
  descricao: string;
  tipo: string;
  status: string;
  prioridade: number;
  responsavel?: string;
  latitude?: number;
  longitude?: number;
  regiaoId?: string;
  bairroId?: string;
}
