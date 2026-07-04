"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { InteracaoFormData } from "@/types/crm";

interface FormularioInteracaoProps {
  contatoId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const tipos = ["visita", "ligacao", "reuniao", "mensagem"];

export function FormularioInteracao({ contatoId, onSaved, onCancel }: FormularioInteracaoProps) {
  const [formData, setFormData] = useState<InteracaoFormData>({
    tipo: "visita",
    descricao: "",
    data: new Date().toISOString().slice(0, 10),
    responsavel: "",
    contatoId,
  });
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch("/api/crm/interacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <select
          value={formData.tipo}
          onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            value={formData.data}
            onChange={(e) => setFormData((p) => ({ ...p, data: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Responsável</label>
          <input
            type="text"
            value={formData.responsavel}
            onChange={(e) => setFormData((p) => ({ ...p, responsavel: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {salvando ? "Salvando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
