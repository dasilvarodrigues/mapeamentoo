"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { ListaContatos } from "@/components/crm/ListaContatos";
import { ModalContato } from "@/components/crm/ModalContato";
import { FormularioContato } from "@/components/crm/FormularioContato";
import type { ContatoType } from "@/types/crm";

export default function CrmPage() {
  const [contatos, setContatos] = useState<ContatoType[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCriar, setModalCriar] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchContatos = useCallback(async () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    const res = await fetch(`/api/crm/contatos?${params}`);
    const data = await res.json();
    setContatos(data);
  }, [busca]);

  useEffect(() => {
    fetchContatos();
  }, [fetchContatos, refreshKey]);

  const handleSaved = () => {
    setModalAberto(false);
    setModalCriar(false);
    setContatoSelecionado(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleted = () => {
    setModalAberto(false);
    setContatoSelecionado(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold">CRM Comunitário</h1>
          </div>
          <button
            onClick={() => setModalCriar(true)}
            className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>

        <ListaContatos
          contatos={contatos}
          busca={busca}
          onBuscaChange={(v) => setBusca(v)}
          onSelect={(c) => { setContatoSelecionado(c); setModalAberto(true); }}
        />
      </div>

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Novo Contato</h3>
            <FormularioContato onSaved={handleSaved} onCancel={() => setModalCriar(false)} />
          </div>
        </div>
      )}

      <ModalContato
        contato={contatoSelecionado}
        open={modalAberto}
        onClose={() => { setModalAberto(false); setContatoSelecionado(null); }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
