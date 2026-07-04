"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { ContatoFormData, ContatoType } from "@/types/crm";

interface FormularioContatoProps {
  contato?: ContatoType | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function FormularioContato({ contato, onSaved, onCancel }: FormularioContatoProps) {
  const [formData, setFormData] = useState<ContatoFormData>({
    nome: "",
    telefone: "",
    email: "",
    cargo: "",
    redesSociais: "",
    bairroId: "",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (contato) {
      setFormData({
        nome: contato.nome,
        telefone: contato.telefone,
        email: contato.email || "",
        cargo: contato.cargo || "",
        redesSociais: contato.redesSociais ? JSON.stringify(contato.redesSociais) : "",
        bairroId: contato.bairroId || "",
        observacoes: contato.observacoes || "",
      });
    }
  }, [contato]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const url = contato ? `/api/crm/contatos/${contato.id}` : "/api/crm/contatos";
      const method = contato ? "PUT" : "POST";
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone *</label>
          <input
            type="text"
            value={formData.telefone}
            onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cargo</label>
          <input
            type="text"
            value={formData.cargo || ""}
            onChange={(e) => setFormData((p) => ({ ...p, cargo: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Redes Sociais (JSON)</label>
        <input
          type="text"
          value={formData.redesSociais || ""}
          onChange={(e) => setFormData((p) => ({ ...p, redesSociais: e.target.value }))}
          placeholder='{"instagram": "@usuario", "facebook": "usuario"}'
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <textarea
          value={formData.observacoes || ""}
          onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[60px]"
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
          {salvando ? "Salvando..." : contato ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
