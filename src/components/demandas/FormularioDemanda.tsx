"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { DemandaFormData, DemandaType } from "@/types/demandas";

interface FormularioDemandaProps {
  demanda?: DemandaType | null;
  onSaved: () => void;
  onCancel: () => void;
}

const categorias = ["iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento"];
const tipos = ["emergencial", "rotina", "projeto"];
const statusList = ["aberta", "em_andamento", "resolvida"];

export function FormularioDemanda({ demanda, onSaved, onCancel }: FormularioDemandaProps) {
  const [formData, setFormData] = useState<DemandaFormData>({
    categoria: "",
    descricao: "",
    tipo: "rotina",
    status: "aberta",
    prioridade: 0,
    responsavel: "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (demanda) {
      setFormData({
        categoria: demanda.categoria,
        descricao: demanda.descricao,
        tipo: demanda.tipo,
        status: demanda.status,
        prioridade: demanda.prioridade,
        responsavel: demanda.responsavel || "",
      });
    }
  }, [demanda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const url = demanda ? `/api/demandas/${demanda.id}` : "/api/demandas";
      const method = demanda ? "PUT" : "POST";
      await fetch(url, {
        method,
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
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData((p) => ({ ...p, categoria: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
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
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {statusList.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prioridade (1-5)</label>
          <input
            type="number"
            min={0}
            max={5}
            value={formData.prioridade}
            onChange={(e) => setFormData((p) => ({ ...p, prioridade: parseInt(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Responsável</label>
        <input
          type="text"
          value={formData.responsavel || ""}
          onChange={(e) => setFormData((p) => ({ ...p, responsavel: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
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
          {salvando ? "Salvando..." : demanda ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
