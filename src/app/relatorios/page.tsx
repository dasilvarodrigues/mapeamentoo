"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { SidebarRelatorios } from "@/components/relatorios/SidebarRelatorios";
import { RelatorioPreview } from "@/components/relatorios/RelatorioPreview";
import { RelatorioCustomizado } from "@/components/relatorios/RelatorioCustomizado";
import { FiltrosRelatorio } from "@/components/relatorios/FiltrosRelatorio";
import { ExportarPDF } from "@/components/relatorios/ExportarPDF";
import type { TipoRelatorio, FiltrosRelatorio as FiltrosType } from "@/types/relatorios";

export default function RelatoriosPage() {
  const [tipoAtivo, setTipoAtivo] = useState<TipoRelatorio>("geral");
  const [filtros, setFiltros] = useState<FiltrosType>({});

  const filtrosStr = Object.entries(filtros)
    .map(([k, v]) => (v ? `&${k}=${encodeURIComponent(v)}` : ""))
    .join("");

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold">Relatórios</h1>
          </div>
          <ExportarPDF />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div>
            <SidebarRelatorios ativo={tipoAtivo} onChange={setTipoAtivo} />
          </div>

          <div>
            {tipoAtivo !== "customizado" && (
              <FiltrosRelatorio
                filtros={filtros}
                onChange={setFiltros}
                showExtra={tipoAtivo === "geral"}
              />
            )}

            <div className="relatorio-conteudo">
              {tipoAtivo === "customizado" ? (
                <RelatorioCustomizado />
              ) : (
                <RelatorioPreview tipo={tipoAtivo} filtros={filtrosStr} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
