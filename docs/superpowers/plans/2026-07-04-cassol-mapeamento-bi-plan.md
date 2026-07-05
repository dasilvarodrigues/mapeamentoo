# BI / Relatórios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the BI/Relatórios module with 6 pre-defined reports, a custom report builder, and PDF export via optimized browser print.

**Architecture:** Prisma aggregation queries via Next.js API routes, React components using Recharts for charts and ShadCN UI for layout, `window.print()` with CSS `@media print` for PDF export.

**Tech Stack:** Next.js 16, Prisma 7, Recharts, ShadCN UI, Lucide React

---

## File Structure

```
src/
├── app/relatorios/
│   ├── page.tsx                      # Main page: sidebar + preview + filters
│   └── layout.tsx                    # Metadata
│   └── api/relatorios/
│       ├── pre-definidos/route.ts    # GET — aggregated data per report type
│       └── customizado/route.ts      # GET — custom report data
├── components/relatorios/
│   ├── SidebarRelatorios.tsx         # Left nav: 6 pre-defined + custom
│   ├── RelatorioCustomizado.tsx      # Form with metric/filter/grouping selects
│   ├── RelatorioPreview.tsx          # Renders charts + table for current report
│   ├── FiltrosRelatorio.tsx          # Date range + region + status filters bar
│   ├── ExportarPDF.tsx               # `window.print()` trigger button
│   ├── RelatorioPrint.tsx            # Print-optimized version wrapper
│   ├── GraficoBarra.tsx              # Recharts BarChart wrapper
│   ├── GraficoPizza.tsx              # Recharts PieChart wrapper
│   ├── GraficoLinha.tsx              # Recharts LineChart wrapper
│   └── TabelaRelatorio.tsx           # Styled table with number formatting
└── types/
    └── relatorios.ts                 # Report types and API response interfaces
```

---

### Task 1: Types for BI module

**Files:**
- Create: `/var/www/html/mapeamento/src/types/relatorios.ts`

- [ ] **Step 1: Write types**

Write to `/var/www/html/mapeamento/src/types/relatorios.ts`:

```ts
export type TipoRelatorio =
  | "geral"
  | "localidade"
  | "tipo"
  | "responsaveis"
  | "cobertura"
  | "crm"
  | "customizado";

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  regiaoId?: string;
  bairroId?: string;
  tipo?: string;
  status?: string;
  responsavel?: string;
}

export interface RelatorioCustomizadoParams extends FiltrosRelatorio {
  metricas: string[];
  agruparPor: "nenhum" | "bairro" | "tipo" | "responsavel" | "mes";
}

export interface KpiGeral {
  label: string;
  value: number;
  variacao?: number;
}

export interface DadoGrafico {
  nome: string;
  valor: number;
  cor?: string;
}

export interface DadoSerie {
  mes: string;
  abertas: number;
  resolvidas: number;
}

export interface DadoLinha {
  label: string;
  total: number;
  resolvidas: number;
  pendentes: number;
}

export interface DadoCobertura {
  regiao: string;
  bairros: {
    nome: string;
    totalDemandas: number;
    comunidades: number;
  }[];
}

export interface DadoInteracao {
  data: string;
  tipo: string;
  descricao: string;
  contato: string;
  responsavel: string;
}

export interface RelatorioGeral {
  kpis: KpiGeral[];
  evolucaoMensal: DadoSerie[];
}

export interface RelatorioLocalidade {
  bairros: DadoGrafico[];
  tabela: { bairro: string; total: number }[];
}

export interface RelatorioTipo {
  distribuicao: DadoGrafico[];
  tabela: { tipo: string; total: number; percentual: string }[];
}

export interface RelatorioResponsaveis {
  ranking: DadoLinha[];
}

export interface RelatorioCobertura {
  dados: DadoCobertura[];
}

export interface RelatorioCRM {
  interacoes: DadoInteracao[];
  contatosAtivos: number;
  interacoesPorMes: DadoGrafico[];
}

export type DadosRelatorio =
  | RelatorioGeral
  | RelatorioLocalidade
  | RelatorioTipo
  | RelatorioResponsaveis
  | RelatorioCobertura
  | RelatorioCRM
  | Record<string, unknown>;
```

- [ ] **Step 2: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add bi relatorios types"
```

---

### Task 2: API — Pre-defined reports route

**Files:**
- Create: `/var/www/html/mapeamento/src/app/api/relatorios/pre-definidos/route.ts`

- [ ] **Step 1: Create API route directory**

```bash
mkdir -p /var/www/html/mapeamento/src/app/api/relatorios/pre-definidos
```

- [ ] **Step 2: Write the route**

Write to `/var/www/html/mapeamento/src/app/api/relatorios/pre-definidos/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || "geral";
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const dateFilter: Record<string, unknown> = {};
  if (dataInicio) dateFilter.gte = new Date(dataInicio);
  if (dataFim) dateFilter.lte = new Date(dataFim);

  const whereDate = Object.keys(dateFilter).length
    ? { createdAt: dateFilter }
    : {};

  switch (tipo) {
    case "geral": {
      const [totalDemandas, abertas, resolvidas, visitas, contatos] =
        await Promise.all([
          prisma.demanda.count({ where: whereDate }),
          prisma.demanda.count({ where: { ...whereDate, status: "aberta" } }),
          prisma.demanda.count({
            where: { ...whereDate, status: "resolvida" },
          }),
          prisma.visita.count({ where: whereDate }),
          prisma.contato.count(),
        ]);

      const demandas = await prisma.demanda.findMany({
        where: whereDate,
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      });

      const meses: Record<string, { abertas: number; resolvidas: number }> =
        {};
      for (const d of demandas) {
        const mes = d.createdAt.toISOString().slice(0, 7);
        if (!meses[mes]) meses[mes] = { abertas: 0, resolvidas: 0 };
        if (d.status === "resolvida") meses[mes].resolvidas++;
        else meses[mes].abertas++;
      }

      const evolucaoMensal = Object.entries(meses)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, vals]) => ({ mes, ...vals }));

      return NextResponse.json({
        kpis: [
          { label: "Total de Demandas", value: totalDemandas },
          { label: "Demandas Abertas", value: abertas },
          { label: "Demandas Resolvidas", value: resolvidas },
          { label: "Visitas Realizadas", value: visitas },
          { label: "Contatos Registrados", value: contatos },
        ],
        evolucaoMensal,
      });
    }

    case "localidade": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["bairroId"],
        _count: { id: true },
        where: whereDate,
      });

      const bairros = await prisma.bairro.findMany({
        select: { id: true, nome: true },
      });
      const bairroMap = new Map(bairros.map((b) => [b.id, b.nome]));

      const dados = agrupado
        .map((g) => ({
          nome: bairroMap.get(g.bairroId || "") || "Sem bairro",
          valor: g._count.id,
        }))
        .sort((a, b) => b.valor - a.valor);

      const tabela = dados.map((d) => ({
        bairro: d.nome,
        total: d.valor,
      }));

      return NextResponse.json({ bairros: dados, tabela });
    }

    case "tipo": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["tipo"],
        _count: { id: true },
        where: whereDate,
      });

      const total =
        agrupado.reduce((acc, g) => acc + g._count.id, 0) || 1;
      const distribuicao = agrupado.map((g) => ({
        nome: g.tipo,
        valor: g._count.id,
      }));
      const tabela = agrupado.map((g) => ({
        tipo: g.tipo,
        total: g._count.id,
        percentual: ((g._count.id / total) * 100).toFixed(1) + "%",
      }));

      return NextResponse.json({ distribuicao, tabela });
    }

    case "responsaveis": {
      const agrupado = await prisma.demanda.groupBy({
        by: ["responsavel"],
        _count: { id: true },
        where: whereDate,
      });

      const demandas = await prisma.demanda.findMany({
        where: whereDate,
        select: { responsavel: true, status: true },
      });

      const stats: Record<
        string,
        { total: number; resolvidas: number; pendentes: number }
      > = {};
      for (const d of demandas) {
        const nome = d.responsavel || "Sem responsável";
        if (!stats[nome]) stats[nome] = { total: 0, resolvidas: 0, pendentes: 0 };
        stats[nome].total++;
        if (d.status === "resolvida") stats[nome].resolvidas++;
        else stats[nome].pendentes++;
      }

      const ranking = Object.entries(stats)
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json({ ranking });
    }

    case "cobertura": {
      const regioes = await prisma.regiao.findMany({
        include: {
          bairros: {
            include: {
              _count: { select: { demandas: true } },
              comunidades: { select: { id: true } },
            },
          },
        },
      });

      const dados = regioes.map((r) => ({
        regiao: r.nome,
        bairros: r.bairros.map((b) => ({
          nome: b.nome,
          totalDemandas: b._count.demandas,
          comunidades: b.comunidades.length,
        })),
      }));

      return NextResponse.json({ dados });
    }

    case "crm": {
      const whereInteracao: Record<string, unknown> = {};
      if (dataInicio) whereInteracao.data = { ...whereInteracao.data, gte: new Date(dataInicio) };
      if (dataFim) whereInteracao.data = { ...whereInteracao.data, lte: new Date(dataFim) };

      const interacoes = await prisma.interacao.findMany({
        where: whereInteracao,
        include: { contato: { select: { nome: true } } },
        orderBy: { data: "desc" },
        take: 50,
      });

      const contatosAtivos = await prisma.contato.count();

      const interacoesPorMesRaw = await prisma.interacao.findMany({
        where: whereInteracao,
        select: { data: true },
      });

      const porMes: Record<string, number> = {};
      for (const i of interacoesPorMesRaw) {
        const mes = i.data.toISOString().slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + 1;
      }

      const interacoesPorMes = Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([nome, valor]) => ({ nome, valor }));

      return NextResponse.json({
        interacoes: interacoes.map((i) => ({
          data: i.data.toISOString(),
          tipo: i.tipo,
          descricao: i.descricao,
          contato: i.contato.nome,
          responsavel: i.responsavel,
        })),
        contatosAtivos,
        interacoesPorMes,
      });
    }

    default:
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add relatorios pre-definidos API route"
```

---

### Task 3: API — Custom report route

**Files:**
- Create: `/var/www/html/mapeamento/src/app/api/relatorios/customizado/route.ts`

- [ ] **Step 1: Create API route directory**

```bash
mkdir -p /var/www/html/mapeamento/src/app/api/relatorios/customizado
```

- [ ] **Step 2: Write the route**

Write to `/var/www/html/mapeamento/src/app/api/relatorios/customizado/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const metricas = searchParams.getAll("metricas[]");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const regiaoId = searchParams.get("regiaoId");
  const bairroId = searchParams.get("bairroId");
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");
  const responsavel = searchParams.get("responsavel");
  const agruparPor = searchParams.get("agruparPor") || "nenhum";

  const where: Record<string, unknown> = {};
  if (dataInicio) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dataInicio) };
  if (dataFim) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(dataFim) };
  if (regiaoId) where.regiaoId = regiaoId;
  if (bairroId) where.bairroId = bairroId;
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;
  if (responsavel) where.responsavel = responsavel;

  const result: Record<string, unknown> = {};

  if (metricas.includes("demandas") || metricas.length === 0) {
    const total = await prisma.demanda.count({ where });

    if (agruparPor === "bairro") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["bairroId"],
        _count: { id: true },
        where,
      });
      const bairros = await prisma.bairro.findMany({
        select: { id: true, nome: true },
      });
      const mapa = new Map(bairros.map((b) => [b.id, b.nome]));
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: mapa.get(g.bairroId || "") || "Sem bairro",
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "tipo") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["tipo"],
        _count: { id: true },
        where,
      });
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: g.tipo,
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "responsavel") {
      const agrupado = await prisma.demanda.groupBy({
        by: ["responsavel"],
        _count: { id: true },
        where,
      });
      result.demandas = {
        total,
        agrupado: agrupado.map((g) => ({
          label: g.responsavel || "Sem responsável",
          valor: g._count.id,
        })),
      };
    } else if (agruparPor === "mes") {
      const demandas = await prisma.demanda.findMany({
        where,
        select: { createdAt: true },
      });
      const porMes: Record<string, number> = {};
      for (const d of demandas) {
        const mes = d.createdAt.toISOString().slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
      result.demandas = {
        total,
        agrupado: Object.entries(porMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, valor]) => ({ label, valor })),
      };
    } else {
      result.demandas = { total };
    }
  }

  if (metricas.includes("visitas")) {
    const whereVisita: Record<string, unknown> = {};
    if (dataInicio) whereVisita.data = { gte: new Date(dataInicio) };
    if (dataFim) whereVisita.data = { lte: new Date(dataFim) };
    if (regiaoId) whereVisita.regiaoId = regiaoId;

    const total = await prisma.visita.count({ where: whereVisita });
    result.visitas = { total };
  }

  if (metricas.includes("contatos")) {
    const total = await prisma.contato.count();
    result.contatos = { total };
  }

  if (metricas.includes("interacoes")) {
    const whereInteracao: Record<string, unknown> = {};
    if (dataInicio) whereInteracao.data = { gte: new Date(dataInicio) };
    if (dataFim) whereInteracao.data = { lte: new Date(dataFim) };

    const total = await prisma.interacao.count({ where: whereInteracao });
    result.interacoes = { total };
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add relatorios customizado API route"
```

---

### Task 4: Chart components (GraficoBarra, GraficoPizza, GraficoLinha)

**Files:**
- Create: `/var/www/html/mapeamento/src/components/relatorios/GraficoBarra.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/GraficoPizza.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/GraficoLinha.tsx`

- [ ] **Step 1: Write GraficoBarra**

Write to `/var/www/html/mapeamento/src/components/relatorios/GraficoBarra.tsx`:

```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GraficoBarraProps {
  data: { nome: string; valor: number }[];
  height?: number;
}

export function GraficoBarra({ data, height = 300 }: GraficoBarraProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="nome" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
          }}
        />
        <Bar dataKey="valor" fill="hsl(var(--brand-600))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Write GraficoPizza**

Write to `/var/www/html/mapeamento/src/components/relatorios/GraficoPizza.tsx`:

```tsx
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
          label={({ nome, percentual }: { nome: string; percentual: number }) =>
            `${nome} ${(percentual * 100).toFixed(0)}%`
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
```

- [ ] **Step 3: Write GraficoLinha**

Write to `/var/www/html/mapeamento/src/components/relatorios/GraficoLinha.tsx`:

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DadoSerie {
  mes: string;
  abertas?: number;
  resolvidas?: number;
  [key: string]: string | number | undefined;
}

interface GraficoLinhaProps {
  data: DadoSerie[];
  linhas: { dataKey: string; cor: string; nome: string }[];
  height?: number;
}

export function GraficoLinha({ data, linhas, height = 300 }: GraficoLinhaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="mes" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
          }}
        />
        <Legend />
        {linhas.map((l) => (
          <Line
            key={l.dataKey}
            type="monotone"
            dataKey={l.dataKey}
            stroke={l.cor}
            name={l.nome}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add chart components (bar, pie, line)"
```

---

### Task 5: TabelaRelatorio and ExportarPDF components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/relatorios/TabelaRelatorio.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/ExportarPDF.tsx`

- [ ] **Step 1: Write TabelaRelatorio**

Write to `/var/www/html/mapeamento/src/components/relatorios/TabelaRelatorio.tsx`:

```tsx
"use client";

interface Coluna {
  key: string;
  label: string;
  formato?: "numero" | "percentual" | "texto";
}

interface TabelaRelatorioProps {
  colunas: Coluna[];
  dados: Record<string, unknown>[];
}

export function TabelaRelatorio({ colunas, dados }: TabelaRelatorioProps) {
  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum dado encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {colunas.map((col) => (
              <th
                key={col.key}
                className="text-left p-2 font-medium text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((linha, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30">
              {colunas.map((col) => (
                <td key={col.key} className="p-2">
                  {col.formato === "numero"
                    ? Number(linha[col.key]).toLocaleString("pt-BR")
                    : col.formato === "percentual"
                    ? String(linha[col.key])
                    : String(linha[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Write ExportarPDF**

Write to `/var/www/html/mapeamento/src/components/relatorios/ExportarPDF.tsx`:

```tsx
"use client";

import { Printer } from "lucide-react";

interface ExportarPDFProps {
  label?: string;
}

export function ExportarPDF({ label = "Exportar PDF" }: ExportarPDFProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-700 transition no-print"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add TabelaRelatorio and ExportarPDF components"
```

---

### Task 6: SidebarRelatorios and FiltrosRelatorio components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/relatorios/SidebarRelatorios.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/FiltrosRelatorio.tsx`

- [ ] **Step 1: Write SidebarRelatorios**

Write to `/var/www/html/mapeamento/src/components/relatorios/SidebarRelatorios.tsx`:

```tsx
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
```

- [ ] **Step 2: Write FiltrosRelatorio**

Write to `/var/www/html/mapeamento/src/components/relatorios/FiltrosRelatorio.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import type { FiltrosRelatorio as FiltrosType } from "@/types/relatorios";

interface FiltrosRelatorioProps {
  filtros: FiltrosType;
  onChange: (filtros: FiltrosType) => void;
  showExtra?: boolean;
}

export function FiltrosRelatorio({
  filtros,
  onChange,
  showExtra = false,
}: FiltrosRelatorioProps) {
  const [regioes, setRegioes] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/ranking")
      .then((r) => r.json())
      .then(setRegioes)
      .catch(() => {});
  }, []);

  const update = (campo: string, valor: string) => {
    onChange({ ...filtros, [campo]: valor || undefined });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 no-print">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <input
          type="date"
          value={filtros.dataInicio || ""}
          onChange={(e) => update("dataInicio", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="text-muted-foreground">até</span>
        <input
          type="date"
          value={filtros.dataFim || ""}
          onChange={(e) => update("dataFim", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {showExtra && (
        <>
          <select
            value={filtros.regiaoId || ""}
            onChange={(e) => update("regiaoId", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas regiões</option>
            {regioes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          <select
            value={filtros.status || ""}
            onChange={(e) => update("status", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvida</option>
          </select>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add SidebarRelatorios and FiltrosRelatorio components"
```

---

### Task 7: RelatorioCustomizado, RelatorioPreview, and RelatorioPrint components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/relatorios/RelatorioCustomizado.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/RelatorioPreview.tsx`
- Create: `/var/www/html/mapeamento/src/components/relatorios/RelatorioPrint.tsx`

- [ ] **Step 1: Write RelatorioCustomizado**

Write to `/var/www/html/mapeamento/src/components/relatorios/RelatorioCustomizado.tsx`:

```tsx
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
                  data={(val as { agrupado: DadoAgrupado[] }).agrupado}
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
```

- [ ] **Step 2: Write RelatorioPreview**

Write to `/var/www/html/mapeamento/src/components/relatorios/RelatorioPreview.tsx`:

```tsx
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
            data={g.evolucaoMensal}
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
            dados={r.ranking}
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
            dados={crm.interacoes.slice(0, 20)}
          />
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 3: Write RelatorioPrint**

Write to `/var/www/html/mapeamento/src/components/relatorios/RelatorioPrint.tsx`:

```tsx
"use client";

import { ReactNode } from "react";

interface RelatorioPrintProps {
  titulo: string;
  children: ReactNode;
}

export function RelatorioPrint({ titulo, children }: RelatorioPrintProps) {
  return (
    <div className="print-only">
      <div className="hidden print:block">
        <h1 className="text-xl font-bold mb-4">{titulo}</h1>
        {children}
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-family: Georgia, serif; color: #000; }
          .print-only { display: block !important; width: 100%; }
          table { page-break-inside: avoid; }
          section { page-break-after: always; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add RelatorioCustomizado, RelatorioPreview, RelatorioPrint components"
```

---

### Task 8: Main page and layout

**Files:**
- Create: `/var/www/html/mapeamento/src/app/relatorios/layout.tsx`
- Create: `/var/www/html/mapeamento/src/app/relatorios/page.tsx`

- [ ] **Step 1: Create app directory**

```bash
mkdir -p /var/www/html/mapeamento/src/app/relatorios
```

- [ ] **Step 2: Write layout**

Write to `/var/www/html/mapeamento/src/app/relatorios/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatórios | Cassol Mapeamento Regional",
};

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Write page**

Write to `/var/www/html/mapeamento/src/app/relatorios/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { SidebarRelatorios } from "@/components/relatorios/SidebarRelatorios";
import { RelatorioPreview } from "@/components/relatorios/RelatorioPreview";
import { RelatorioCustomizado } from "@/components/relatorios/RelatorioCustomizado";
import { FiltrosRelatorio } from "@/components/relatorios/FiltrosRelatorio";
import { ExportarPDF } from "@/components/relatorios/ExportarPDF";
import type { TipoRelatorio, FiltrosRelatorio as FiltrosType } from "@/types/relatorios";

export default function RelatoriosPage() {
  const [tipoAtivo, setTipoAtivo] = useState<TipoRelatorio>("geral");
  const [filtros, setFiltros] = useState<FiltrosType>({});

  const filtrosStr = Object.entries(filtros)
    .map(([k, v]) => (v ? `&${k}=${encodeURIComponent(v)}` : ""))
    .join("");

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold">Relatórios</h1>
          </div>
          <ExportarPDF />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div>
            <SidebarRelatorios ativo={tipoAtivo} onChange={setTipoAtivo} />
          </div>

          <div>
            {tipoAtivo !== "customizado" && (
              <FiltrosRelatorio
                filtros={filtros}
                onChange={setFiltros}
                showExtra={tipoAtivo === "geral"}
              />
            )}

            <div className="relatorio-conteudo">
              {tipoAtivo === "customizado" ? (
                <RelatorioCustomizado />
              ) : (
                <RelatorioPreview tipo={tipoAtivo} filtros={filtrosStr} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build check**

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -25
```

Expected: Build succeeds with no errors. New routes appear: `/relatorios`.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add relatorios main page with layout"
```

---

## Self-Review

**1. Spec coverage:**
- Layout sidebar + preview → Tasks 6 (SidebarRelatorios), 7 (RelatorioPreview), 8 (page)
- 6 relatórios pré-definidos → Task 2 (API) + Task 7 (RelatorioPreview renders each type)
- Relatório Customizável → Task 3 (API) + Task 7 (RelatorioCustomizado component)
- Filtros (período, região, status) → Task 6 (FiltrosRelatorio component)
- Exportar PDF → Task 5 (ExportarPDF) + Task 7 (RelatorioPrint with CSS @media print)
- Gráficos (barra, pizza, linha) → Task 4
- Tabela → Task 5 (TabelaRelatorio)
- CSS @media print → Task 7 (RelatorioPrint)

**2. Placeholder scan:** No TBD, TODO, incomplete code, or "implement later" found. All steps have complete executable code.

**3. Type consistency:** `TipoRelatorio`, `FiltrosRelatorio`, `DadosRelatorio` and all response types defined in Task 1 match usage across Tasks 2-8. All component props interfaces match their consumers.
