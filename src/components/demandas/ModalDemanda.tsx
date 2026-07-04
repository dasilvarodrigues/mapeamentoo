"use client";

import { useState } from "react";
import { X, Trash2, Edit3 } from "lucide-react";
import { FormularioDemanda } from "./FormularioDemanda";
import type { DemandaType } from "@/types/demandas";

interface ModalDemandaProps {
  demanda: DemandaType | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
};

export function ModalDemanda({ demanda, open, onClose, onSaved, onDeleted }: ModalDemandaProps) {
  const [editando, setEditando] = useState(false);

  if (!open || !demanda) return null;

  const handleDelete = async () => {
    if (!confirm("Excluir esta demanda?")) return;
    await fetch(`/api/demandas/${demanda.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editando ? "Editar Demanda" : "Detalhes da Demanda"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {editando ? (
          <FormularioDemanda
            demanda={demanda}
            onSaved={() => { setEditando(false); onSaved(); }}
            onCancel={() => setEditando(false)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm font-medium">{demanda.descricao}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="text-sm font-medium capitalize">{demanda.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{demanda.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{statusLabels[demanda.status] || demanda.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <p className="text-sm font-medium">{demanda.prioridade}/5</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="text-sm font-medium">{demanda.responsavel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="text-sm font-medium">
                  {new Date(demanda.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            {demanda.resolvedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Resolvida em</p>
                <p className="text-sm font-medium">
                  {new Date(demanda.resolvedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
