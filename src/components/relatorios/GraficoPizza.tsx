"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface GraficoPizzaProps {
  data: { nome: string; valor: number }[];
  height?: number;
}

const COLORS = [
  "hsl(var(--brand-600))",
  "hsl(var(--brand-400))",
  "hsl(var(--brand-200))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
];

export function GraficoPizza({ data, height = 300 }: GraficoPizzaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="valor"
          label={(props: { payload?: { nome: string }; percent?: number }) =>
            `${props.payload?.nome ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
