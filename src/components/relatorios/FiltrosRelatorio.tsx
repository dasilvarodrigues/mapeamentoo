"use client";

import { useEffect, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import type { FiltrosRelatorio as FiltrosType } from "@/types/relatorios";

interface FiltrosRelatorioProps {
  filtros: FiltrosType;
  onChange: (filtros: FiltrosType) => void;
  showExtra?: boolean;
}

export function FiltrosRelatorio({
  filtros,
  onChange,
  showExtra = false,
}: FiltrosRelatorioProps) {
  const [regioes, setRegioes] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetch("/api/territorio/regioes")
      .then((r) => r.json())
      .then(setRegioes)
      .catch(() => {});
  }, []);

  const update = (campo: string, valor: string) => {
    onChange({ ...filtros, [campo]: valor || undefined });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 no-print">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <input
          type="date"
          value={filtros.dataInicio || ""}
          onChange={(e) => update("dataInicio", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="text-muted-foreground">até</span>
        <input
          type="date"
          value={filtros.dataFim || ""}
          onChange={(e) => update("dataFim", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {showExtra && (
        <>
          <select
            value={filtros.regiaoId || ""}
            onChange={(e) => update("regiaoId", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas regiões</option>
            {regioes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          <select
            value={filtros.status || ""}
            onChange={(e) => update("status", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvida</option>
          </select>
        </>
      )}
    </div>
  );
}
