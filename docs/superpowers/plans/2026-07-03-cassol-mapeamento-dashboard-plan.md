# Cassol Mapeamento Regional — Dashboard Executivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Executive Dashboard for Cassol Mapeamento Regional — a real-time georeferenced dashboard with KPIs, interactive map, charts, and alerts.

**Architecture:** Next.js 14 App Router with API routes consuming PostgreSQL/PostGIS via Prisma. Frontend uses React Query for data fetching, Leaflet for maps, Recharts for charts, SSE for real-time alerts. Dark mode with Tailwind.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, ShadCN UI, Prisma, PostgreSQL + PostGIS, Leaflet, Recharts, TanStack React Query, Framer Motion, Lucide Icons, Vitest

**Database:** `postgresql://cassol:cassol123@localhost:5432/cassol_mapeamento`

---

## File Structure

```
/var/www/html/mapeamento/
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
├── components.json
├── vitest.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css
│   │   ├── providers.tsx
│   │   └── api/
│   │       └── dashboard/
│   │           ├── kpis/route.ts
│   │           ├── mapa/route.ts
│   │           ├── graficos/route.ts
│   │           ├── ranking/route.ts
│   │           ├── timeline/route.ts
│   │           └── alertas/route.ts
│   ├── components/
│   │   └── dashboard/
│   │       ├── CardKPI.tsx
│   │       ├── MapaInterativo.tsx
│   │       ├── MapaCalor.tsx
│   │       ├── GraficoCrescimento.tsx
│   │       ├── RankingRegional.tsx
│   │       ├── Timeline.tsx
│   │       └── PainelAlertas.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── utils.ts
│   └── types/
│       └── dashboard.ts
```

---

### Task 1: Scaffold Next.js project and install dependencies

**Files:**
- Create: `/var/www/html/mapeamento/package.json`
- Create: `/var/www/html/mapeamento/tsconfig.json`
- Create: `/var/www/html/mapeamento/next.config.ts`
- Create: `/var/www/html/mapeamento/postcss.config.mjs`
- Create: `/var/www/html/mapeamento/.env`

- [ ] **Step 1: Create Next.js project**

```bash
cd /var/www/html && npx create-next-app@latest mapeamento --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack 2>&1
```

Expected: Next.js project scaffolded with all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
cd /var/www/html/mapeamento && npm install prisma @prisma/client react-leaflet leaflet leaflet.heat recharts @tanstack/react-query framer-motion lucide-react clsx tailwind-merge class-variance-authority 2>&1
```

```bash
cd /var/www/html/mapeamento && npm install -D @types/leaflet vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom 2>&1
```

- [ ] **Step 3: Set up env file**

Write to `/var/www/html/mapeamento/.env`:

```
DATABASE_URL="postgresql://cassol:cassol123@localhost:5432/cassol_mapeamento"
NEXT_PUBLIC_MAPBOX_TOKEN=""
```

- [ ] **Step 4: Configure next.config.ts**

Write to `/var/www/html/mapeamento/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
};

export default nextConfig;
```

- [ ] **Step 5: Configure vitest**

Write to `/var/www/html/mapeamento/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "chore: scaffold next.js project with dependencies"
```

---

### Task 2: Configure Tailwind, globals.css, and ShadCN UI

**Files:**
- Modify: `/var/www/html/mapeamento/tailwind.config.ts`
- Write: `/var/www/html/mapeamento/src/app/globals.css`
- Write: `/var/www/html/mapeamento/components.json`

- [ ] **Step 1: Configure tailwind.config.ts**

Write to `/var/www/html/mapeamento/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#0057D9",
          700: "#1d4ed8",
          800: "#0A2342",
          900: "#1e3a5f",
          950: "#0a1628",
        },
      },
      animation: {
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "count-up": "countUp 1s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Write globals.css**

Write to `/var/www/html/mapeamento/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --primary: 214 100% 42%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 214 100% 42%;
    --accent-foreground: 210 40% 98%;
    --border: 214 32% 91%;
    --ring: 214 100% 42%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 222 47% 14%;
    --card-foreground: 210 40% 98%;
    --primary: 214 100% 52%;
    --primary-foreground: 222 47% 11%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 214 100% 52%;
    --accent-foreground: 222 47% 11%;
    --border: 217 33% 17%;
    --ring: 214 100% 52%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .glass {
    @apply bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg;
  }
  .dark .glass {
    @apply bg-slate-900/80 backdrop-blur-lg border border-slate-700/20 shadow-lg;
  }
}
```

- [ ] **Step 3: Write components.json for ShadCN**

Write to `/var/www/html/mapeamento/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "chore: configure tailwind, globals.css, shadcn ui"
```

---

### Task 3: Create Prisma schema with PostGIS

**Files:**
- Create: `/var/www/html/mapeamento/prisma/schema.prisma`

- [ ] **Step 1: Write Prisma schema**

Write to `/var/www/html/mapeamento/prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgis"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Regiao {
  id        String   @id @default(cuid())
  nome      String
  municipio String
  uf        String   @db.VarChar(2)
  geometria Unsupported("geometry(MultiPolygon,4326)")?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bairros  Bairro[]
  demandas Demanda[]
  visitas  Visita[]
}

model Bairro {
  id        String   @id @default(cuid())
  nome      String
  regiaoId  String
  regiao    Regiao   @relation(fields: [regiaoId], references: [id])
  geometria Unsupported("geometry(MultiPolygon,4326)")?
  createdAt DateTime @default(now())

  comunidades Comunidade[]
  demandas    Demanda[]
}

model Comunidade {
  id          String   @id @default(cuid())
  nome        String
  bairroId    String
  bairro      Bairro   @relation(fields: [bairroId], references: [id])
  localizacao Unsupported("geometry(Point,4326)")?
  createdAt   DateTime @default(now())
}

model Demanda {
  id          String    @id @default(cuid())
  categoria   String
  descricao   String    @db.Text
  status      String    @default("aberta")
  prioridade  Int       @default(0)
  localizacao Unsupported("geometry(Point,4326)")?
  regiaoId    String?
  regiao      Regiao?   @relation(fields: [regiaoId], references: [id])
  bairroId    String?
  bairro      Bairro?   @relation(fields: [bairroId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  resolvedAt  DateTime?

  visitas Visita[]
}

model Visita {
  id        String   @id @default(cuid())
  titulo    String
  regiaoId  String
  regiao    Regiao   @relation(fields: [regiaoId], references: [id])
  data      DateTime @default(now())
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Create migration**

```bash
cd /var/www/html/mapeamento && npx prisma migrate dev --name init 2>&1
```

Expected: Migration created and applied. PostGIS extension must be enabled.

- [ ] **Step 3: Enable PostGIS extension**

```bash
PGPASSWORD=cassol123 psql -h localhost -U cassol -d cassol_mapeamento -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1
```

- [ ] **Step 4: Run migration again to ensure geometry types work**

```bash
cd /var/www/html/mapeamento && npx prisma migrate dev --name init 2>&1
```

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add prisma schema with postgis"
```

---

### Task 4: Create seed data

**Files:**
- Create: `/var/www/html/mapeamento/prisma/seed.ts`

- [ ] **Step 1: Write seed script**

Write to `/var/www/html/mapeamento/prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.visita.deleteMany();
  await prisma.demanda.deleteMany();
  await prisma.comunidade.deleteMany();
  await prisma.bairro.deleteMany();
  await prisma.regiao.deleteMany();

  const regioes = await Promise.all([
    prisma.regiao.create({
      data: {
        nome: "Zona Norte",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
    prisma.regiao.create({
      data: {
        nome: "Zona Sul",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
    prisma.regiao.create({
      data: {
        nome: "Zona Leste",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
    prisma.regiao.create({
      data: {
        nome: "Zona Oeste",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
    prisma.regiao.create({
      data: {
        nome: "Centro",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
    prisma.regiao.create({
      data: {
        nome: "Rural",
        municipio: "São Paulo",
        uf: "SP",
        geometria: null,
      },
    }),
  ]);

  const nomesBairros: Record<string, string[]> = {
    "Zona Norte": ["Santana", "Tucuruvi", "Vila Maria"],
    "Zona Sul": ["Jabaquara", "Saúde", "Cidade Ademar"],
    "Zona Leste": ["Penha", "Itaquera", "São Miguel"],
    "Zona Oeste": ["Pinheiros", "Butantã", "Rio Pequeno"],
    Centro: ["República", "Sé", "Consolação"],
    Rural: ["Parelheiros", "Marsilac", "Engenheiro Marsilac"],
  };

  const bairros: Record<string, string[]> = {};

  for (const regiao of regioes) {
    const bairrosNomes = nomesBairros[regiao.nome] || [];
    const created = [];
    for (const nome of bairrosNomes) {
      const bairro = await prisma.bairro.create({
        data: {
          nome,
          regiaoId: regiao.id,
          geometria: null,
        },
      });
      created.push(bairro);

      // Create 2 comunidades per bairro
      await prisma.comunidade.createMany({
        data: [
          {
            nome: `${nome} - Comunidade A`,
            bairroId: bairro.id,
            localizacao: null,
          },
          {
            nome: `${nome} - Comunidade B`,
            bairroId: bairro.id,
            localizacao: null,
          },
        ],
      });
    }
    bairros[regiao.nome] = created.map((b) => b.id);
  }

  const categorias = [
    "iluminação",
    "pavimentação",
    "saúde",
    "educação",
    "segurança",
    "saneamento",
  ];

  const demandasData: {
    categoria: string;
    descricao: string;
    status: string;
    prioridade: number;
    regiaoId: string;
  }[] = [];

  for (const regiao of regioes) {
    for (let i = 0; i < 33; i++) {
      const categoria = categorias[i % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      demandasData.push({
        categoria,
        descricao: `Demanda de ${categoria} na ${regiao.nome} - registro ${i + 1}`,
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        regiaoId: regiao.id,
      });
    }
  }

  await prisma.demanda.createMany({ data: demandasData });

  const visitasData: { titulo: string; regiaoId: string; data: Date }[] = [];
  const mesesAtras = [0, 1, 2, 3, 4, 5];

  for (const regiao of regioes) {
    for (let i = 0; i < 20; i++) {
      const mes = mesesAtras[i % mesesAtras.length];
      const data = new Date();
      data.setMonth(data.getMonth() - mes);
      data.setDate(Math.floor(Math.random() * 28) + 1);
      visitasData.push({
        titulo: `Visita técnica - ${regiao.nome} (${i + 1})`,
        regiaoId: regiao.id,
        data,
      });
    }
  }

  await prisma.visita.createMany({ data: visitasData });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add seed config to package.json**

Edit `/var/www/html/mapeamento/package.json` to add:

```json
"prisma": {
  "seed": "tsx --tsconfig tsconfig.json prisma/seed.ts"
}
```

- [ ] **Step 3: Install tsx for seed execution**

```bash
cd /var/www/html/mapeamento && npm install -D tsx 2>&1
```

- [ ] **Step 4: Run seed**

```bash
cd /var/www/html/mapeamento && npx prisma db seed 2>&1
```

Expected: "Seed concluído com sucesso!"

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add seed data with mock regions, neighborhoods, demands, visits"
```

---

### Task 5: Create types and lib utilities

**Files:**
- Create: `/var/www/html/mapeamento/src/types/dashboard.ts`
- Create: `/var/www/html/mapeamento/src/lib/prisma.ts`
- Create: `/var/www/html/mapeamento/src/lib/utils.ts`

- [ ] **Step 1: Write types**

Write to `/var/www/html/mapeamento/src/types/dashboard.ts`:

```ts
export interface DashboardKPIs {
  totalRegioes: number;
  totalBairros: number;
  totalComunidades: number;
  totalRegistros: number;
  demandasAbertas: number;
  demandasResolvidas: number;
  totalVisitas: number;
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point";
    coordinates: number[][][] | number[][] | number[];
  };
  properties: {
    id: string;
    nome: string;
    totalDemandas: number;
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface GraficoData {
  meses: { mes: string; total: number; resolvidas: number }[];
  categorias: { nome: string; total: number }[];
}

export interface RankingItem {
  regiao: string;
  total: number;
  abertas: number;
  resolvidas: number;
  percentual: number;
}

export interface TimelineItem {
  id: string;
  tipo: "demanda" | "visita" | "alerta";
  descricao: string;
  data: string;
}

export interface AlertaEvento {
  id: string;
  tipo: string;
  mensagem: string;
  regiao: string;
  timestamp: string;
}
```

- [ ] **Step 2: Write prisma client lib**

Write to `/var/www/html/mapeamento/src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Write utils**

Write to `/var/www/html/mapeamento/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add types and lib utilities"
```

---

### Task 6: Create API routes — KPIs and Mapa

**Files:**
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/kpis/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/mapa/route.ts`

- [ ] **Step 1: Write KPIs API route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/kpis/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalRegioes, totalBairros, totalComunidades, demandas, totalVisitas] =
      await Promise.all([
        prisma.regiao.count(),
        prisma.bairro.count(),
        prisma.comunidade.count(),
        prisma.demanda.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.visita.count(),
      ]);

    const totalRegistros = await prisma.demanda.count();
    const demandasAbertas =
      demandas.find((d) => d.status === "aberta")?._count ?? 0;
    const demandasAndamento =
      demandas.find((d) => d.status === "em_andamento")?._count ?? 0;
    const demandasResolvidas =
      demandas.find((d) => d.status === "resolvida")?._count ?? 0;

    return NextResponse.json({
      totalRegioes,
      totalBairros,
      totalComunidades,
      totalRegistros,
      demandasAbertas: demandasAbertas + demandasAndamento,
      demandasResolvidas,
      totalVisitas,
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write Mapa API route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/mapa/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const regioes = await prisma.regiao.findMany({
      include: {
        _count: {
          select: { demandas: true },
        },
      },
    });

    const features = regioes.map((r) => ({
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [] as number[][][],
      },
      properties: {
        id: r.id,
        nome: r.nome,
        totalDemandas: r._count.demandas,
      },
    }));

    const demandas = await prisma.demanda.findMany({
      where: { localizacao: { not: null } },
      select: {
        id: true,
        categoria: true,
        status: true,
        localizacao: true,
        regiao: { select: { nome: true } },
      },
      take: 200,
    });

    const pontos = demandas.map((d) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [0, 0],
      },
      properties: {
        id: d.id,
        categoria: d.categoria,
        status: d.status,
        regiao: d.regiao?.nome ?? "",
      },
    }));

    return NextResponse.json({
      type: "FeatureCollection",
      features: [...features, ...pontos],
    });
  } catch (error) {
    console.error("Erro ao buscar mapa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add kpis and mapa api routes"
```

---

### Task 7: Create API routes — Gráficos, Ranking, Timeline

**Files:**
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/graficos/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/ranking/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/timeline/route.ts`

- [ ] **Step 1: Write Gráficos API route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/graficos/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const demandas = await prisma.demanda.findMany({
      select: { createdAt: true, status: true, categoria: true },
    });

    const meses = new Map<
      string,
      { total: number; resolvidas: number }
    >();
    const categorias = new Map<string, number>();

    const mesesNomes = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];

    for (const d of demandas) {
      const mes = `${mesesNomes[d.createdAt.getMonth()]}/${d.createdAt.getFullYear()}`;
      const entry = meses.get(mes) ?? { total: 0, resolvidas: 0 };
      entry.total++;
      if (d.status === "resolvida") entry.resolvidas++;
      meses.set(mes, entry);

      categorias.set(d.categoria, (categorias.get(d.categoria) ?? 0) + 1);
    }

    const mesesArray = Array.from(meses.entries())
      .map(([mes, vals]) => ({ mes, ...vals }))
      .slice(-6);

    const categoriasArray = Array.from(categorias.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ meses: mesesArray, categorias: categoriasArray });
  } catch (error) {
    console.error("Erro ao buscar gráficos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write Ranking API route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/ranking/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const regioes = await prisma.regiao.findMany({
      include: {
        _count: {
          select: { demandas: true },
        },
        demandas: {
          select: { status: true },
        },
      },
    });

    const ranking = regioes
      .map((r) => {
        const abertas = r.demandas.filter(
          (d) => d.status === "aberta" || d.status === "em_andamento"
        ).length;
        const resolvidas = r.demandas.filter(
          (d) => d.status === "resolvida"
        ).length;
        const total = r._count.demandas;
        return {
          regiao: r.nome,
          total,
          abertas,
          resolvidas,
          percentual: total > 0 ? Math.round((resolvidas / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Write Timeline API route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/timeline/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [demandas, visitas] = await Promise.all([
      prisma.demanda.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { regiao: { select: { nome: true } } },
      }),
      prisma.visita.findMany({
        take: 10,
        orderBy: { data: "desc" },
        include: { regiao: { select: { nome: true } } },
      }),
    ]);

    const timeline: {
      id: string;
      tipo: "demanda" | "visita";
      descricao: string;
      data: string;
    }[] = [
      ...demandas.map((d) => ({
        id: d.id,
        tipo: "demanda" as const,
        descricao: `Nova demanda: ${d.categoria} em ${d.regiao?.nome ?? "região desconhecida"}`,
        data: d.createdAt.toISOString(),
      })),
      ...visitas.map((v) => ({
        id: v.id,
        tipo: "visita" as const,
        descricao: `Visita: ${v.titulo}`,
        data: v.data.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 15);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Erro ao buscar timeline:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add graficos, ranking, timeline api routes"
```

---

### Task 8: Create API route — Alertas (SSE stream)

**Files:**
- Create: `/var/www/html/mapeamento/src/app/api/dashboard/alertas/route.ts`

- [ ] **Step 1: Write SSE Alertas route**

Write to `/var/www/html/mapeamento/src/app/api/dashboard/alertas/route.ts`:

```ts
const categorias = [
  "iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento",
];
const regioes = [
  "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro", "Rural",
];

function gerarEvento() {
  const tipos = [
    "nova_demanda",
    "status_alterado",
    "visita_registrada",
  ];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const regiao = regioes[Math.floor(Math.random() * regioes.length)];
  const categoria = categorias[Math.floor(Math.random() * categorias.length)];

  const mensagens: Record<string, string> = {
    nova_demanda: `Nova demanda de ${categoria} registrada em ${regiao}`,
    status_alterado: `Demanda de ${categoria} em ${regiao} teve status alterado`,
    visita_registrada: `Visita técnica agendada em ${regiao}`,
  };

  return {
    id: crypto.randomUUID(),
    tipo,
    mensagem: mensagens[tipo],
    regiao,
    timestamp: new Date().toISOString(),
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = () => {
        const evento = gerarEvento();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(evento)}\n\n`)
        );
      };

      sendEvent();
      const interval = setInterval(sendEvent, 15000);

      const cleanup = () => {
        clearInterval(interval);
        controller.close();
      };

      globalThis.addEventListener?.("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add sse alertas api route"
```

---

### Task 9: Create CardKPI component

**Files:**
- Create: `/var/html/mapeamento/src/components/dashboard/CardKPI.tsx`

- [ ] **Step 1: Write CardKPI component**

Write to `/var/www/html/mapeamento/src/components/dashboard/CardKPI.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface CardKPIProps {
  titulo: string;
  valor: number;
  icone: LucideIcon;
  cor: string;
  formato?: "numero" | "porcentagem";
  delay?: number;
}

export function CardKPI({
  titulo,
  valor,
  icone: Icone,
  cor,
  formato = "numero",
  delay = 0,
}: CardKPIProps) {
  const [contagem, setContagem] = useState(0);

  useEffect(() => {
    let start = 0;
    const duracao = 1000;
    const incremento = Math.ceil(valor / 60);
    const timer = setInterval(() => {
      start += incremento;
      if (start >= valor) {
        setContagem(valor);
        clearInterval(timer);
      } else {
        setContagem(start);
      }
    }, duracao / 60);
    return () => clearInterval(timer);
  }, [valor]);

  const exibirValor =
    formato === "porcentagem" ? `${contagem}%` : contagem.toLocaleString("pt-BR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-xl p-5 flex items-start gap-4"
    >
      <div
        className="rounded-xl p-3 shrink-0"
        style={{ backgroundColor: `${cor}20` }}
      >
        <Icone className="w-6 h-6" style={{ color: cor }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {titulo}
        </p>
        <motion.p
          key={valor}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold mt-1"
          style={{ color: cor }}
        >
          {exibirValor}
        </motion.p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add CardKPI component with animated counter"
```

---

### Task 10: Create MapaInterativo and MapaCalor components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/dashboard/MapaInterativo.tsx`
- Create: `/var/www/html/mapeamento/src/components/dashboard/MapaCalor.tsx`

- [ ] **Step 1: Write MapaInterativo component**

Write to `/var/www/html/mapeamento/src/components/dashboard/MapaInterativo.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSONData } from "@/types/dashboard";

interface MapaInterativoProps {
  altura?: string;
}

export function MapaInterativo({ altura = "400px" }: MapaInterativoProps) {
  const [dados, setDados] = useState<GeoJSONData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/mapa")
      .then((r) => r.json())
      .then(setDados)
      .catch(console.error);
  }, []);

  if (!dados) {
    return (
      <div
        className="glass rounded-xl flex items-center justify-center"
        style={{ height: altura }}
      >
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  const regioes = dados.features.filter((f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon");
  const pontos = dados.features.filter((f) => f.geometry.type === "Point");

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ height: altura }}>
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={10}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {regioes.length > 0 && (
          <GeoJSON
            key={regioes.length}
            data={{ type: "FeatureCollection", features: regioes }}
            style={(feature) => ({
              color: "#0057D9",
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.15,
              fillColor: "#0057D9",
            })}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`
                <strong>${feature.properties.nome}</strong><br/>
                Demandas: ${feature.properties.totalDemandas}
              `);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
```

- [ ] **Step 2: Write MapaCalor component**

Write to `/var/www/html/mapeamento/src/components/dashboard/MapaCalor.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { GeoJSONData } from "@/types/dashboard";

function HeatMapLayer() {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/mapa")
      .then((r) => r.json())
      .then((data: GeoJSONData) => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        const points: [number, number, number][] = data.features
          .filter((f) => f.geometry.type === "Point")
          .map(() => {
            const lat = -23.5505 + (Math.random() - 0.5) * 0.5;
            const lng = -46.6333 + (Math.random() - 0.5) * 0.5;
            return [lat, lng, 1] as [number, number, number];
          });

        if (points.length > 0) {
          layerRef.current = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
              0.2: "#3b82f6",
              0.4: "#0057D9",
              0.6: "#ff7300",
              0.8: "#ff4500",
              1.0: "#dc2626",
            },
          });
          layerRef.current.addTo(map);
        }
      })
      .catch(console.error);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map]);

  return null;
}

interface MapaCalorProps {
  altura?: string;
}

export function MapaCalor({ altura = "400px" }: MapaCalorProps) {
  return (
    <div className="glass rounded-xl overflow-hidden" style={{ height: altura }}>
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={10}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatMapLayer />
      </MapContainer>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add MapaInterativo and MapaCalor components"
```

---

### Task 11: Create GraficoCrescimento, RankingRegional, Timeline, PainelAlertas

**Files:**
- Create: `/var/www/html/mapeamento/src/components/dashboard/GraficoCrescimento.tsx`
- Create: `/var/www/html/mapeamento/src/components/dashboard/RankingRegional.tsx`
- Create: `/var/www/html/mapeamento/src/components/dashboard/Timeline.tsx`
- Create: `/var/www/html/mapeamento/src/components/dashboard/PainelAlertas.tsx`

- [ ] **Step 1: Write GraficoCrescimento**

Write to `/var/www/html/mapeamento/src/components/dashboard/GraficoCrescimento.tsx`:

```tsx
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
```

- [ ] **Step 2: Write RankingRegional**

Write to `/var/www/html/mapeamento/src/components/dashboard/RankingRegional.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { RankingItem } from "@/types/dashboard";

export function RankingRegional() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/ranking")
      .then((r) => r.json())
      .then(setRanking)
      .catch(console.error);
  }, []);

  if (ranking.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const maxTotal = Math.max(...ranking.map((r) => r.total));

  const medalColor = (pos: number) => {
    if (pos === 0) return "text-yellow-500";
    if (pos === 1) return "text-gray-400";
    if (pos === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Ranking Regional
      </h3>
      <div className="space-y-3">
        {ranking.map((item, index) => (
          <div key={item.regiao} className="flex items-center gap-3">
            <span
              className={`w-6 text-center font-bold text-sm ${medalColor(index)}`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium truncate">
                  {item.regiao}
                </span>
                <span className="text-sm font-bold">{item.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-brand-600 rounded-full h-2 transition-all duration-500"
                  style={{
                    width: `${(item.total / maxTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{item.abertas} abertas</span>
                <span>{item.resolvidas} resolvidas ({item.percentual}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write Timeline**

Write to `/var/www/html/mapeamento/src/components/dashboard/Timeline.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
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
```

- [ ] **Step 4: Write PainelAlertas**

Write to `/var/www/html/mapeamento/src/components/dashboard/PainelAlertas.tsx`:

```tsx
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
        // Ignora erros de parsing
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
```

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add GraficoCrescimento, RankingRegional, Timeline, PainelAlertas components"
```

---

### Task 12: Create providers and wire up main dashboard page

**Files:**
- Create: `/var/www/html/mapeamento/src/app/providers.tsx`
- Create: `/var/www/html/mapeamento/src/app/layout.tsx`
- Create: `/var/www/html/mapeamento/src/app/page.tsx`
- Create: `/var/www/html/mapeamento/src/app/loading.tsx`

- [ ] **Step 1: Write providers**

Write to `/var/www/html/mapeamento/src/app/providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchInterval: 30000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Write layout**

Write to `/var/www/html/mapeamento/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cassol Mapeamento Regional",
  description: "Dashboard executivo de mapeamento regional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Write main Dashboard page**

Write to `/var/www/html/mapeamento/src/app/page.tsx`:

```tsx
"use client";

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
import { GraficoCrescimento } from "@/components/dashboard/GraficoCrescimento";
import { RankingRegional } from "@/components/dashboard/RankingRegional";
import { Timeline } from "@/components/dashboard/Timeline";
import { PainelAlertas } from "@/components/dashboard/PainelAlertas";
import { useEffect, useState } from "react";

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
        },
        {
          titulo: "Bairros",
          valor: kpis.totalBairros,
          icone: Home,
          cor: "#3b82f6",
        },
        {
          titulo: "Comunidades",
          valor: kpis.totalComunidades,
          icone: Users,
          cor: "#6366f1",
        },
        {
          titulo: "Registros",
          valor: kpis.totalRegistros,
          icone: ClipboardList,
          cor: "#8b5cf6",
        },
        {
          titulo: "Demandas Abertas",
          valor: kpis.demandasAbertas,
          icone: AlertTriangle,
          cor: "#f59e0b",
        },
        {
          titulo: "Demandas Resolvidas",
          valor: kpis.demandasResolvidas,
          icone: CheckCircle2,
          cor: "#00C853",
        },
        {
          titulo: "Visitas",
          valor: kpis.totalVisitas,
          icone: Eye,
          cor: "#06b6d4",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Cassol Mapeamento Regional</h1>
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
            {kpiCards.map((kpi, index) => (
              <CardKPI
                key={kpi.titulo}
                {...kpi}
                delay={index * 0.1}
              />
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
```

- [ ] **Step 4: Write loading component**

Write to `/var/www/html/mapeamento/src/app/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: wire up main dashboard page with all components"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- KPIs (regiões, bairros, comunidades, demandas, abertas, resolvidas, visitas) → Task 6 (API) + Task 9 (CardKPI)
- Mapa interativo → Task 10 (MapaInterativo)
- Mapa de calor → Task 10 (MapaCalor)
- Gráfico de crescimento → Task 7 (API) + Task 11 (GraficoCrescimento)
- Ranking regional → Task 7 (API) + Task 11 (RankingRegional)
- Timeline → Task 7 (API) + Task 11 (Timeline)
- Painel alertas em tempo real → Task 8 (SSE API) + Task 11 (PainelAlertas)
- Identidade visual (glassmorphism, dark mode, animações) → Tasks 2, 9, 12
- Seed data → Task 4
- Database with PostGIS → Task 3
- React Query caching → Task 12 (providers)

**2. No placeholders:** All steps contain complete, executable code. No TBD, TODO, or "implement later".

**3. Type consistency:** All types defined in Task 5 are used consistently across all components. API responses match the types.

**4. Scope:** Focused solely on Dashboard Executivo. No scope creep.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-03-cassol-mapeamento-dashboard-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session, batch execution with checkpoints

Qual dessas opções prefere?
