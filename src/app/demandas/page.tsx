"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutList, Columns3 } from "lucide-react";
import { FiltrosDemandas } from "@/components/demandas/FiltrosDemandas";
import { TabelaDemandas } from "@/components/demandas/TabelaDemandas";
import { KanbanDemandas } from "@/components/demandas/KanbanDemandas";
import { FormularioDemanda } from "@/components/demandas/FormularioDemanda";
import { ModalDemanda } from "@/components/demandas/ModalDemanda";
import type { DemandaType, DemandaListResponse } from "@/types/demandas";

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<DemandaType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [regiaoId, setRegiaoId] = useState("");
  const [busca, setBusca] = useState("");
  const [modoKanban, setModoKanban] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCriar, setModalCriar] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<DemandaType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDemandas = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (status) params.set("status", status);
    if (categoria) params.set("categoria", categoria);
    if (regiaoId) params.set("regiaoId", regiaoId);
    if (busca) params.set("busca", busca);

    const res = await fetch(`/api/demandas?${params}`);
    const data: DemandaListResponse = await res.json();
    setDemandas(data.demandas);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [page, status, categoria, regiaoId, busca]);

  useEffect(() => {
    fetchDemandas();
  }, [fetchDemandas, refreshKey]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/demandas/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleSaved = () => {
    setModalAberto(false);
    setModalCriar(false);
    setDemandaSelecionada(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleted = () => {
    setModalAberto(false);
    setDemandaSelecionada(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestão de Demandas</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setModoKanban(!modoKanban)}
              className="glass rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-muted transition"
            >
              {modoKanban ? <LayoutList className="w-4 h-4" /> : <Columns3 className="w-4 h-4" />}
              {modoKanban ? "Tabela" : "Kanban"}
            </button>
            <button
              onClick={() => setModalCriar(true)}
              className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nova Demanda
            </button>
          </div>
        </div>

        <FiltrosDemandas
          status={status}
          categoria={categoria}
          regiaoId={regiaoId}
          busca={busca}
          onStatusChange={(v) => { setStatus(v); setPage(1); }}
          onCategoriaChange={(v) => { setCategoria(v); setPage(1); }}
          onRegiaoChange={(v) => { setRegiaoId(v); setPage(1); }}
          onBuscaChange={(v) => { setBusca(v); setPage(1); }}
        />

        {modoKanban ? (
          <KanbanDemandas
            demandas={demandas}
            onStatusChange={handleStatusChange}
            onSelect={(d) => { setDemandaSelecionada(d); setModalAberto(true); }}
          />
        ) : (
          <TabelaDemandas
            demandas={demandas}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelect={(d) => { setDemandaSelecionada(d); setModalAberto(true); }}
          />
        )}
      </div>

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Nova Demanda</h3>
            <FormularioDemanda onSaved={handleSaved} onCancel={() => setModalCriar(false)} />
          </div>
        </div>
      )}

      <ModalDemanda
        demanda={demandaSelecionada}
        open={modalAberto}
        onClose={() => { setModalAberto(false); setDemandaSelecionada(null); }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
