"use client";

import { useEffect, useState } from "react";
import { GraficoBarra } from "./GraficoBarra";
import { GraficoPizza } from "./GraficoPizza";
import { GraficoLinha } from "./GraficoLinha";
import { TabelaRelatorio } from "./TabelaRelatorio";
import type {
  TipoRelatorio,
  DadosRelatorio,
  RelatorioGeral,
  RelatorioLocalidade,
  RelatorioTipo,
  RelatorioResponsaveis,
  RelatorioCobertura,
  RelatorioCRM,
} from "@/types/relatorios";

interface RelatorioPreviewProps {
  tipo: TipoRelatorio;
  filtros: string;
}

export function RelatorioPreview({ tipo, filtros }: RelatorioPreviewProps) {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (tipo === "customizado") return;
    const fetchDados = async () => {
      setCarregando(true);
      try {
        const res = await fetch(`/api/relatorios/pre-definidos?tipo=${tipo}${filtros}`);
        const data = await res.json();
        setDados(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };
    fetchDados();
  }, [tipo, filtros]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Selecione um relatório ao lado.</p>
      </div>
    );
  }

  if (tipo === "geral") {
    const g = dados as RelatorioGeral;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {g.kpis.map((kpi) => (
            <div key={kpi.label} className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{kpi.value.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Evolução Mensal</h3>
          <GraficoLinha
            data={g.evolucaoMensal as any[]}
            linhas={[
              { dataKey: "abertas", cor: "hsl(var(--warning))", nome: "Abertas" },
              { dataKey: "resolvidas", cor: "hsl(var(--success))", nome: "Resolvidas" },
            ]}
          />
        </div>
      </div>
    );
  }

  if (tipo === "localidade") {
    const l = dados as RelatorioLocalidade;
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Demandas por Bairro</h3>
          <GraficoBarra data={l.bairros} />
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Tabela</h3>
          <TabelaRelatorio
            colunas={[
              { key: "bairro", label: "Bairro" },
              { key: "total", label: "Total", formato: "numero" },
            ]}
            dados={l.tabela}
          />
        </div>
      </div>
    );
  }

  if (tipo === "tipo") {
    const t = dados as RelatorioTipo;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Distribuição</h3>
          <GraficoPizza data={t.distribuicao} />
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Tabela</h3>
          <TabelaRelatorio
            colunas={[
              { key: "tipo", label: "Tipo" },
              { key: "total", label: "Total", formato: "numero" },
              { key: "percentual", label: "%", formato: "percentual" },
            ]}
            dados={t.tabela}
          />
        </div>
      </div>
    );
  }

  if (tipo === "responsaveis") {
    const r = dados as RelatorioResponsaveis;
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Ranking</h3>
          <GraficoBarra
            data={r.ranking.map((item) => ({ nome: item.label, valor: item.total }))}
          />
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Detalhamento</h3>
          <TabelaRelatorio
            colunas={[
              { key: "label", label: "Responsável" },
              { key: "total", label: "Total", formato: "numero" },
              { key: "resolvidas", label: "Resolvidas", formato: "numero" },
              { key: "pendentes", label: "Pendentes", formato: "numero" },
            ]}
            dados={r.ranking as any[]}
          />
        </div>
      </div>
    );
  }

  if (tipo === "cobertura") {
    const c = dados as RelatorioCobertura;
    return (
      <div className="space-y-6">
        {c.dados.map((regiao) => (
          <div key={regiao.regiao} className="glass rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">{regiao.regiao}</h3>
            <TabelaRelatorio
              colunas={[
                { key: "nome", label: "Bairro" },
                { key: "totalDemandas", label: "Demandas", formato: "numero" },
                { key: "comunidades", label: "Comunidades", formato: "numero" },
              ]}
              dados={regiao.bairros}
            />
          </div>
        ))}
      </div>
    );
  }

  if (tipo === "crm") {
    const crm = dados as RelatorioCRM;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{crm.contatosAtivos}</p>
            <p className="text-xs text-muted-foreground mt-1">Contatos Ativos</p>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Interações por Mês</h3>
          <GraficoBarra data={crm.interacoesPorMes} />
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">Últimas Interações</h3>
          <TabelaRelatorio
            colunas={[
              { key: "data", label: "Data" },
              { key: "tipo", label: "Tipo" },
              { key: "contato", label: "Contato" },
              { key: "responsavel", label: "Responsável" },
              { key: "descricao", label: "Descrição" },
            ]}
            dados={crm.interacoes.slice(0, 20) as any[]}
          />
        </div>
      </div>
    );
  }

  return null;
}
