"use client";

import { useState } from "react";
import { Save } from "lucide-react";

type NivelTipo = "estado" | "municipio" | "bairro" | "comunidade" | "setor" | "rua";

interface FormularioLocalidadeProps {
  nivel: NivelTipo;
  parentId: string;
  onSaved: () => void;
}

const campos: Record<NivelTipo, { name: string; label: string; type: string }[]> = {
  estado: [
    { name: "id", label: "Código IBGE", type: "text" },
    { name: "nome", label: "Nome", type: "text" },
    { name: "uf", label: "UF", type: "text" },
  ],
  municipio: [
    { name: "nome", label: "Nome", type: "text" },
  ],
  bairro: [
    { name: "nome", label: "Nome", type: "text" },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
  ],
  comunidade: [
    { name: "nome", label: "Nome", type: "text" },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
  ],
  setor: [
    { name: "nome", label: "Nome", type: "text" },
  ],
  rua: [
    { name: "nome", label: "Nome", type: "text" },
    { name: "cep", label: "CEP", type: "text" },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
  ],
};

const apis: Record<NivelTipo, string> = {
  estado: "/api/territorio/estados",
  municipio: "/api/territorio/municipios",
  bairro: "/api/territorio/bairros",
  comunidade: "/api/territorio/comunidades",
  setor: "/api/territorio/setores",
  rua: "/api/territorio/ruas",
};

export function FormularioLocalidade({ nivel, parentId, onSaved }: FormularioLocalidadeProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const body: Record<string, string> = { ...formData };
      if (nivel === "municipio") body.estadoId = parentId;
      else if (nivel === "bairro") body.regiaoId = "1"; // fallback
      else if (["comunidade", "setor", "rua"].includes(nivel)) body.bairroId = parentId;

      await fetch(apis[nivel], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setFormData({});
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-4">
      <h3 className="font-semibold">
        Novo {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
      </h3>
      {campos[nivel].map((campo) => (
        <div key={campo.name}>
          <label className="block text-sm font-medium mb-1">{campo.label}</label>
          <input
            type={campo.type}
            value={formData[campo.name] || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, [campo.name]: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required={campo.name === "nome"}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={salvando}
        className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
