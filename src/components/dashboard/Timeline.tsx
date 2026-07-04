"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, MapPin } from "lucide-react";
import { TimelineItem } from "@/types/dashboard";
import { formatDateTime } from "@/lib/utils";

const icones = {
  demanda: AlertCircle,
  visita: MapPin,
  alerta: Clock,
} as const;

const cores = {
  demanda: "text-blue-500",
  visita: "text-green-500",
  alerta: "text-amber-500",
} as const;

export function Timeline() {
  const [itens, setItens] = useState<TimelineItem[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/timeline")
      .then((r) => r.json())
      .then(setItens)
      .catch(console.error);
  }, []);

  if (itens.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Atividades Recentes
      </h3>
      <div className="space-y-0">
        {itens.map((item, index) => {
          const Icone = icones[item.tipo] || Clock;
          const cor = cores[item.tipo] || "text-muted-foreground";
          return (
            <div key={item.id} className="flex gap-3 pb-3 relative">
              {index < itens.length - 1 && (
                <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
              )}
              <div className={`mt-1 shrink-0 ${cor}`}>
                <Icone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{item.descricao}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(item.data)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
