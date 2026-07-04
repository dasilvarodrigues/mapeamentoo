"use client";

import { Search, Filter } from "lucide-react";

interface FiltrosDemandasProps {
  status: string;
  categoria: string;
  regiaoId: string;
  busca: string;
  onStatusChange: (v: string) => void;
  onCategoriaChange: (v: string) => void;
  onRegiaoChange: (v: string) => void;
  onBuscaChange: (v: string) => void;
}

const categorias = ["iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento"];
const statusList = ["aberta", "em_andamento", "resolvida"];

export function FiltrosDemandas({
  status, categoria, regiaoId, busca,
  onStatusChange, onCategoriaChange, onRegiaoChange, onBuscaChange,
}: FiltrosDemandasProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos status</option>
        {statusList.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
      <select
        value={categoria}
        onChange={(e) => onCategoriaChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todas categorias</option>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={regiaoId}
        onChange={(e) => onRegiaoChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todas regiões</option>
      </select>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por descrição..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
