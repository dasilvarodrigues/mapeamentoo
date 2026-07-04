"use client";

import { ArrowUpDown } from "lucide-react";
import type { DemandaType } from "@/types/demandas";

interface TabelaDemandasProps {
  demandas: DemandaType[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (demanda: DemandaType) => void;
}

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
};

const statusColors: Record<string, string> = {
  aberta: "text-red-600",
  em_andamento: "text-amber-600",
  resolvida: "text-green-600",
};

export function TabelaDemandas({ demandas, total, page, totalPages, onPageChange, onSelect }: TabelaDemandasProps) {
  if (demandas.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-muted-foreground">
        Nenhuma demanda encontrada.
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground">Prioridade</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Responsável</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {demandas.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelect(d)}
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition"
              >
                <td className="p-3">{d.prioridade}</td>
                <td className="p-3 max-w-[250px] truncate">{d.descricao}</td>
                <td className="p-3 capitalize">{d.categoria}</td>
                <td className="p-3">
                  <span className={`font-medium ${statusColors[d.status] || ""}`}>
                    {statusLabels[d.status] || d.status}
                  </span>
                </td>
                <td className="p-3">{d.responsavel || "-"}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-border text-sm">
          <span className="text-muted-foreground">{total} demanda(s)</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">{page} de {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
