"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GraficoData } from "@/types/dashboard";

export function GraficoCrescimento() {
  const [dados, setDados] = useState<GraficoData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/graficos")
      .then((r) => r.json())
      .then(setDados)
      .catch(console.error);
  }, []);

  if (!dados) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-lg mb-4">Crescimento de Demandas</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dados.meses}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="mes" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#0057D9"
            strokeWidth={2}
            dot={{ fill: "#0057D9" }}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="resolvidas"
            stroke="#00C853"
            strokeWidth={2}
            dot={{ fill: "#00C853" }}
            name="Resolvidas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
