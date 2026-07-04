"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { AlertaEvento } from "@/types/dashboard";
import { formatDateTime } from "@/lib/utils";

export function PainelAlertas() {
  const [alertas, setAlertas] = useState<AlertaEvento[]>([]);
  const [naoLidos, setNaoLidos] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/dashboard/alertas");

    eventSource.onmessage = (event) => {
      try {
        const evento: AlertaEvento = JSON.parse(event.data);
        setAlertas((prev) => [evento, ...prev].slice(0, 20));
        setNaoLidos((prev) => prev + 1);
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const dismissAlerta = (id: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  };

  const marcarLidos = () => setNaoLidos(0);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alertas
        </h3>
        <button
          onClick={marcarLidos}
          className="relative p-2 rounded-lg hover:bg-muted transition"
        >
          <Bell className="w-5 h-5" />
          {naoLidos > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {naoLidos}
            </span>
          )}
        </button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {alertas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum alerta no momento
          </p>
        )}
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm">{alerta.mensagem}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(alerta.timestamp)}
              </p>
            </div>
            <button
              onClick={() => dismissAlerta(alerta.id)}
              className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
