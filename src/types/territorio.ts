export interface EstadoType {
  id: string;
  nome: string;
  uf: string;
}

export interface MunicipioType {
  id: string;
  nome: string;
  estadoId: string;
}

export interface BairroType {
  id: string;
  nome: string;
  regiaoId: string;
  municipioId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ComunidadeType {
  id: string;
  nome: string;
  bairroId: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SetorType {
  id: string;
  nome: string;
  bairroId: string;
}

export interface RuaType {
  id: string;
  nome: string;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bairroId: string;
}
