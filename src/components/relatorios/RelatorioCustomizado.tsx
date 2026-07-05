"use client";

import { useState } from "react";
import { GraficoBarra } from "./GraficoBarra";
import { GraficoPizza } from "./GraficoPizza";
import { TabelaRelatorio } from "./TabelaRelatorio";

type AgruparPor = "nenhum" | "bairro" | "tipo" | "responsavel" | "mes";

interface DadoAgrupado {
  label: string;
  valor: number;
}

export function RelatorioCustomizado() {
  const [metricas, setMetricas] = useState<string[]>(["demandas"]);
  const [agruparPor, setAgruparPor] = useState<AgruparPor>("nenhum");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("");
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [carregando, setCarregando] = useState(false);

  const toggleMetrica = (m: string) => {
    setMetricas((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleGerar = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      metricas.forEach((m) => params.append("metricas[]", m));
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);
      if (status) params.set("status", status);
      params.set("agruparPor", agruparPor);

      const res = await fetch(`/api/relatorios/customizado?${params}`);
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const demandasAgrupado = (resultado?.demandas as { agrupado?: DadoAgrupado[] })?.agrupado;

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Configurar Relatório Customizado</h3>

        <div>
          <label className="block text-sm font-medium mb-2">Métricas</label>
          <div className="flex flex-wrap gap-2">
            {["demandas", "visitas", "contatos", "interacoes"].map((m) => (
              <button
                key={m}
                onClick={() => toggleMetrica(m)}
                className={`rounded-lg px-3 py-1.5 text-sm border transition ${
                  metricas.includes(m)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-border hover:bg-muted"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agrupar por</label>
            <select
              value={agruparPor}
              onChange={(e) => setAgruparPor(e.target.value as AgruparPor)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="nenhum">Nenhum</option>
              <option value="bairro">Bairro</option>
              <option value="tipo">Tipo</option>
              <option value="responsavel">Responsável</option>
              <option value="mes">Mês</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvida</option>
          </select>
        </div>

        <button
          onClick={handleGerar}
          disabled={carregando}
          className="bg-brand-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {carregando ? "Gerando..." : "Gerar Relatório"}
        </button>
      </div>

      {resultado && (
        <div className="space-y-4">
          {Object.entries(resultado).map(([key, val]) => (
            <div key={key} className="glass rounded-xl p-5">
              <h4 className="font-semibold text-sm mb-3 capitalize">{key}</h4>
              {val && typeof val === "object" && "agrupado" in (val as Record<string, unknown>) ? (
                <GraficoBarra
                  data={(val as { agrupado: DadoAgrupado[] }).agrupado.map((d) => ({ nome: d.label, valor: d.valor }))}
                />
              ) : val && typeof val === "object" && "total" in (val as Record<string, unknown>) ? (
                <p className="text-2xl font-bold">
                  {(val as { total: number }).total.toLocaleString("pt-BR")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
