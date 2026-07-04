"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  nome: string;
  tipo: string;
}

interface BreadcrumbTerritorioProps {
  itens: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export function BreadcrumbTerritorio({ itens, onNavigate }: BreadcrumbTerritorioProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <button
        onClick={() => onNavigate({ id: "", nome: "Início", tipo: "root" })}
        className="hover:text-foreground transition flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        Início
      </button>
      {itens.map((item) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onNavigate(item)}
            className="hover:text-foreground transition"
          >
            {item.nome}
          </button>
        </span>
      ))}
    </nav>
  );
}

export type { BreadcrumbItem };
