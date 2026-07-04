"use client";

import { useState } from "react";
import { BreadcrumbTerritorio, type BreadcrumbItem } from "@/components/territorio/BreadcrumbTerritorio";
import { ArvoreHierarquica } from "@/components/territorio/ArvoreHierarquica";
import { FormularioLocalidade } from "@/components/territorio/FormularioLocalidade";
import { MapaTerritorial } from "@/components/territorio/MapaTerritorial";
import { ModalImportacao } from "@/components/territorio/ModalImportacao";
import { Upload, Plus } from "lucide-react";

type NivelTipo = "estado" | "municipio" | "bairro" | "comunidade" | "setor" | "rua";

export default function TerritorioPage() {
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [nivelAtivo, setNivelAtivo] = useState<NivelTipo | null>(null);
  const [parentId, setParentId] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (item: BreadcrumbItem) => {
    if (item.tipo === "root") {
      setBreadcrumb([]);
      setNivelAtivo(null);
      return;
    }
    const idx = breadcrumb.findIndex((b) => b.id === item.id);
    setBreadcrumb(idx >= 0 ? breadcrumb.slice(0, idx + 1) : [...breadcrumb, item]);
    setNivelAtivo(item.tipo as NivelTipo);
    setParentId(item.id);
  };

  const handleTreeSelect = (tipo: string, id: string, nome: string) => {
    setNivelAtivo(tipo as NivelTipo);
    setParentId(id);
    setBreadcrumb([{ id, nome, tipo }]);
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Cadastro Territorial</h1>
            <BreadcrumbTerritorio itens={breadcrumb} onNavigate={handleNavigate} />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setImportOpen(true)}
              className="glass rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-muted transition"
            >
              <Upload className="w-4 h-4" />
              Importar GIS
            </button>
            {nivelAtivo && (
              <button className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-700 transition">
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ArvoreHierarquica onSelect={handleTreeSelect} />
          </div>
          <div className="lg:col-span-3">
            <MapaTerritorial altura="500px" />
            {nivelAtivo && parentId && (
              <div className="mt-6">
                <FormularioLocalidade
                  key={`${refreshKey}-${nivelAtivo}`}
                  nivel={nivelAtivo}
                  parentId={parentId}
                  onSaved={handleSaved}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalImportacao open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
