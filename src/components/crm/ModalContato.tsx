"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Edit3, Phone, Mail, Globe, Plus } from "lucide-react";
import { TimelineInteracoes } from "./TimelineInteracoes";
import { FormularioInteracao } from "./FormularioInteracao";
import { FormularioContato } from "./FormularioContato";
import type { ContatoType, InteracaoType } from "@/types/crm";

interface ModalContatoProps {
  contato: ContatoType | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ModalContato({ contato, open, onClose, onSaved, onDeleted }: ModalContatoProps) {
  const [editando, setEditando] = useState(false);
  const [novaInteracao, setNovaInteracao] = useState(false);
  const [interacoes, setInteracoes] = useState<InteracaoType[]>([]);

  useEffect(() => {
    if (contato && open && !editando) {
      fetch(`/api/crm/interacoes?contatoId=${contato.id}`)
        .then((r) => r.json())
        .then(setInteracoes);
    }
  }, [contato, open, editando]);

  if (!open || !contato) return null;

  const handleDelete = async () => {
    if (!confirm("Excluir este contato?")) return;
    await fetch(`/api/crm/contatos/${contato.id}`, { method: "DELETE" });
    onDeleted();
  };

  const redesSociais = contato.redesSociais
    ? (typeof contato.redesSociais === "string" ? JSON.parse(contato.redesSociais) : contato.redesSociais)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editando ? "Editar Contato" : contato.nome}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {editando ? (
          <FormularioContato
            contato={contato}
            onSaved={() => { setEditando(false); onSaved(); }}
            onCancel={() => setEditando(false)}
          />
        ) : novaInteracao ? (
          <FormularioInteracao
            contatoId={contato.id}
            onSaved={() => { setNovaInteracao(false); onSaved(); }}
            onCancel={() => setNovaInteracao(false)}
          />
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{contato.telefone}</span>
              </div>
              {contato.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{contato.email}</span>
                </div>
              )}
              {contato.cargo && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">{contato.cargo}</span>
                </div>
              )}
              {redesSociais && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{Object.entries(redesSociais).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>
                </div>
              )}
              {contato.observacoes && (
                <p className="text-sm text-muted-foreground italic">{contato.observacoes}</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Interações</h4>
                <button
                  onClick={() => setNovaInteracao(true)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova
                </button>
              </div>
              <TimelineInteracoes interacoes={interacoes} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border mt-4">
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
          </>
        )}
      </div>
    </div>
  );
}
