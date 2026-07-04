"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Building2, MapPin, TreePine } from "lucide-react";
import type { EstadoType, MunicipioType, BairroType, ComunidadeType } from "@/types/territorio";

interface ArvoreHierarquicaProps {
  onSelect: (tipo: string, id: string, nome: string) => void;
}

export function ArvoreHierarquica({ onSelect }: ArvoreHierarquicaProps) {
  const [estados, setEstados] = useState<EstadoType[]>([]);
  const [expandedEstado, setExpandedEstado] = useState<string | null>(null);
  const [municipios, setMunicipios] = useState<MunicipioType[]>([]);
  const [expandedMunicipio, setExpandedMunicipio] = useState<string | null>(null);
  const [bairros, setBairros] = useState<BairroType[]>([]);

  useEffect(() => {
    fetch("/api/territorio/estados")
      .then((r) => r.json())
      .then(setEstados);
  }, []);

  const toggleEstado = async (estado: EstadoType) => {
    if (expandedEstado === estado.id) {
      setExpandedEstado(null);
      setMunicipios([]);
      return;
    }
    setExpandedEstado(estado.id);
    const res = await fetch(`/api/territorio/municipios?estadoId=${estado.id}`);
    const data = await res.json();
    setMunicipios(data);
  };

  const toggleMunicipio = async (municipio: MunicipioType) => {
    if (expandedMunicipio === municipio.id) {
      setExpandedMunicipio(null);
      setBairros([]);
      return;
    }
    setExpandedMunicipio(municipio.id);
    const res = await fetch(`/api/territorio/bairros?municipioId=${municipio.id}`);
    const data = await res.json();
    setBairros(data);
  };

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <TreePine className="w-4 h-4" />
        Hierarquia Territorial
      </h3>
      <div className="space-y-1">
        {estados.map((estado) => (
          <div key={estado.id}>
            <button
              onClick={() => toggleEstado(estado)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm transition"
            >
              {expandedEstado === estado.id ? (
                <ChevronDown className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )}
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{estado.nome} ({estado.uf})</span>
            </button>
            {expandedEstado === estado.id && (
              <div className="ml-4 space-y-1">
                {municipios.map((m) => (
                  <div key={m.id}>
                    <button
                      onClick={() => toggleMunicipio(m)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm transition"
                    >
                      {expandedMunicipio === m.id ? (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      )}
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.nome}</span>
                    </button>
                    {expandedMunicipio === m.id && (
                      <div className="ml-4 space-y-1">
                        {bairros.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => onSelect("bairro", b.id, b.nome)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm transition"
                          >
                            <MapPin className="w-4 h-4 shrink-0 text-brand-600" />
                            <span className="truncate">{b.nome}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
