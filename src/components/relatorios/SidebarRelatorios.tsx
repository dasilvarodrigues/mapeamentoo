"use client";

import {
  BarChart3,
  MapPin,
  PieChart,
  Trophy,
  LayoutGrid,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import type { TipoRelatorio } from "@/types/relatorios";

interface SidebarRelatoriosProps {
  ativo: TipoRelatorio;
  onChange: (tipo: TipoRelatorio) => void;
}

const itens: { tipo: TipoRelatorio; label: string; icon: React.ReactNode }[] =
  [
    { tipo: "geral", label: "Visão Geral", icon: <BarChart3 className="w-4 h-4" /> },
    { tipo: "localidade", label: "Demandas por Localidade", icon: <MapPin className="w-4 h-4" /> },
    { tipo: "tipo", label: "Demandas por Tipo", icon: <PieChart className="w-4 h-4" /> },
    { tipo: "responsaveis", label: "Ranking de Responsáveis", icon: <Trophy className="w-4 h-4" /> },
    { tipo: "cobertura", label: "Cobertura Territorial", icon: <LayoutGrid className="w-4 h-4" /> },
    { tipo: "crm", label: "Atividades CRM", icon: <Users className="w-4 h-4" /> },
    { tipo: "customizado", label: "Customizado", icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

export function SidebarRelatorios({ ativo, onChange }: SidebarRelatoriosProps) {
  return (
    <div className="glass rounded-xl p-3 space-y-1">
      <h3 className="font-semibold text-sm px-2 py-2">Relatórios</h3>
      {itens.map((item) => (
        <button
          key={item.tipo}
          onClick={() => onChange(item.tipo)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
            ativo === item.tipo
              ? "bg-brand-600 text-white"
              : "hover:bg-muted text-foreground"
          }`}
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
