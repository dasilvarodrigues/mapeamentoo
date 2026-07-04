"use client";

import { useEffect, useState } from "react";
import {
  Map,
  Home,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { CardKPI } from "@/components/dashboard/CardKPI";
import { MapaInterativo } from "@/components/dashboard/MapaInterativo";
import { RankingRegional } from "@/components/dashboard/RankingRegional";
import { GraficoCrescimento } from "@/components/dashboard/GraficoCrescimento";
import { Timeline } from "@/components/dashboard/Timeline";
import { PainelAlertas } from "@/components/dashboard/PainelAlertas";

interface KPIs {
  totalRegioes: number;
  totalBairros: number;
  totalComunidades: number;
  totalRegistros: number;
  demandasAbertas: number;
  demandasResolvidas: number;
  totalVisitas: number;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/kpis")
      .then((r) => r.json())
      .then(setKpis)
      .catch(console.error);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const kpiCards = kpis
    ? [
        {
          titulo: "Regiões",
          valor: kpis.totalRegioes,
          icone: Map,
          cor: "#0057D9",
          delay: 0,
        },
        {
          titulo: "Bairros",
          valor: kpis.totalBairros,
          icone: Home,
          cor: "#3b82f6",
          delay: 0.1,
        },
        {
          titulo: "Comunidades",
          valor: kpis.totalComunidades,
          icone: Users,
          cor: "#6366f1",
          delay: 0.2,
        },
        {
          titulo: "Registros",
          valor: kpis.totalRegistros,
          icone: ClipboardList,
          cor: "#8b5cf6",
          delay: 0.3,
        },
        {
          titulo: "Demandas Abertas",
          valor: kpis.demandasAbertas,
          icone: AlertTriangle,
          cor: "#f59e0b",
          delay: 0.4,
        },
        {
          titulo: "Demandas Resolvidas",
          valor: kpis.demandasResolvidas,
          icone: CheckCircle2,
          cor: "#00C853",
          delay: 0.5,
        },
        {
          titulo: "Visitas",
          valor: kpis.totalVisitas,
          icone: Eye,
          cor: "#06b6d4",
          delay: 0.6,
        },
      ]
    : [];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Cassol Mapeamento Regional
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard Executivo
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="glass rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            {darkMode ? "☀️ Claro" : "🌙 Escuro"}
          </button>
        </header>

        {kpiCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            {kpiCards.map((kpi) => (
              <CardKPI key={kpi.titulo} {...kpi} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <MapaInterativo altura="450px" />
          </div>
          <div className="lg:col-span-1">
            <RankingRegional />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GraficoCrescimento />
          <Timeline />
        </div>

        <PainelAlertas />
      </div>
    </div>
  );
}
