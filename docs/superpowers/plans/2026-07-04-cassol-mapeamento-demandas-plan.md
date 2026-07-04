# Gestão de Demandas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full CRUD module for demandas with table + kanban views, filters, modals, and drag-and-drop status updates.

**Architecture:** Expand Prisma schema with `responsavel`/`tipo` fields, add CRUD API routes under `/api/demandas/`, build React components for table/kanban/form/modal, and a single page at `/demandas`.

**Tech Stack:** Next.js 16, Prisma 7, ShadCN UI, Lucide React, @hello-pangea/dnd (drag & drop)

---

## File Structure

```
src/
├── app/demandas/
│   ├── page.tsx                   # Página principal (tabela/kanban + modais)
│   └── layout.tsx                 # Metadata
│   └── api/demandas/
│       ├── route.ts               # GET (list) + POST (create)
│       └── [id]/route.ts          # GET (detail) + PUT (update) + DELETE
│       └── [id]/status/route.ts   # PATCH (status only)
├── components/demandas/
│   ├── FiltrosDemandas.tsx        # Barra de filtros
│   ├── TabelaDemandas.tsx         # Tabela ordenável
│   ├── KanbanDemandas.tsx         # Quadro kanban com drag & drop
│   ├── CardDemanda.tsx            # Card do kanban
│   ├── FormularioDemanda.tsx      # Formulário criar/editar
│   └── ModalDemanda.tsx           # Modal de detalhes
└── types/
    └── demandas.ts                # Interfaces
```

---

### Task 1: Expand Demanda schema and migrate

**Files:**
- Modify: `/var/www/html/mapeamento/prisma/schema.prisma`

**Step 1:** Add `responsavel` and `tipo` to Demanda model

Replace the Demanda model block:

```prisma
model Demanda {
  id         String    @id @default(cuid())
  categoria  String
  descricao  String    @db.Text
  tipo       String    @default("rotina")
  status     String    @default("aberta")
  prioridade Int       @default(0)
  responsavel String?
  latitude   Float?
  longitude  Float?
  regiaoId   String?
  regiao     Regiao?   @relation(fields: [regiaoId], references: [id])
  bairroId   String?
  bairro     Bairro?   @relation(fields: [bairroId], references: [id])
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  resolvedAt DateTime?
}
```

**Step 2:** Create and apply migration

```bash
cd /var/www/html/mapeamento && npx prisma migrate dev --name add-campos-demanda 2>&1
```

**Step 3:** Regenerate Prisma client

```bash
cd /var/www/html/mapeamento && npx prisma generate 2>&1
```

**Step 4:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add responsavel and tipo to Demanda model"
```

---

### Task 2: Types and API routes for Demandas

**Files:**
- Create: `/var/www/html/mapeamento/src/types/demandas.ts`
- Create: `/var/www/html/mapeamento/src/app/api/demandas/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/demandas/[id]/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/demandas/[id]/status/route.ts`

**Step 1:** Write types

Write to `/var/www/html/mapeamento/src/types/demandas.ts`:

```ts
export interface DemandaType {
  id: string;
  categoria: string;
  descricao: string;
  tipo: string;
  status: string;
  prioridade: number;
  responsavel: string | null;
  latitude: number | null;
  longitude: number | null;
  regiaoId: string | null;
  bairroId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface DemandaListResponse {
  demandas: DemandaType[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DemandaFormData {
  categoria: string;
  descricao: string;
  tipo: string;
  status: string;
  prioridade: number;
  responsavel?: string;
  latitude?: number;
  longitude?: number;
  regiaoId?: string;
  bairroId?: string;
}
```

**Step 2:** Create API directories

```bash
mkdir -p /var/www/html/mapeamento/src/app/api/demandas/\[id\]/status
```

**Step 3:** Write list/create route

Write to `/var/www/html/mapeamento/src/app/api/demandas/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const status = searchParams.get("status");
  const categoria = searchParams.get("categoria");
  const regiaoId = searchParams.get("regiaoId");
  const busca = searchParams.get("busca");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categoria) where.categoria = categoria;
  if (regiaoId) where.regiaoId = regiaoId;
  if (busca) where.descricao = { contains: busca, mode: "insensitive" };

  const [demandas, total] = await Promise.all([
    prisma.demanda.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.demanda.count({ where }),
  ]);

  return NextResponse.json({
    demandas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  const demanda = await prisma.demanda.create({
    data: {
      categoria: data.categoria,
      descricao: data.descricao,
      tipo: data.tipo || "rotina",
      status: data.status || "aberta",
      prioridade: data.prioridade || 0,
      responsavel: data.responsavel || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      regiaoId: data.regiaoId || null,
      bairroId: data.bairroId || null,
    },
  });
  return NextResponse.json(demanda, { status: 201 });
}
```

**Step 4:** Write detail/update/delete route

Write to `/var/www/html/mapeamento/src/app/api/demandas/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demanda = await prisma.demanda.findUnique({ where: { id } });
  if (!demanda) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(demanda);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const demanda = await prisma.demanda.update({
    where: { id },
    data: {
      categoria: data.categoria,
      descricao: data.descricao,
      tipo: data.tipo,
      status: data.status,
      prioridade: data.prioridade,
      responsavel: data.responsavel,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      regiaoId: data.regiaoId ?? null,
      bairroId: data.bairroId ?? null,
      resolvedAt: data.status === "resolvida" ? new Date() : data.resolvedAt ?? null,
    },
  });
  return NextResponse.json(demanda);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.demanda.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**Step 5:** Write status-only update route

Write to `/var/www/html/mapeamento/src/app/api/demandas/[id]/status/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();
  const resolvedAt = status === "resolvida" ? new Date() : null;
  const demanda = await prisma.demanda.update({
    where: { id },
    data: { status, resolvedAt },
  });
  return NextResponse.json(demanda);
}
```

**Step 6:** Build check

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -15
```

**Step 7:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add demandas types and api routes"
```

---

### Task 3: Update seed with more demandas

**Files:**
- Modify: `/var/www/html/mapeamento/prisma/seed.ts`

**Step 1:** Add 100 additional demandas with `tipo` and `responsavel`

After the existing demandas creation (around line 170), add:

```ts
  // Additional demandas with tipo and responsavel
  const tipos = ["emergencial", "rotina", "projeto"];
  const responsaveis = ["Carlos Silva", "Ana Oliveira", "Pedro Santos", "Maria Costa", "João Souza"];
  const maisDemandas: typeof demandasData = [];

  for (const regiao of regioes) {
    const coordsRegiao = regioesSP.find((r) => r.nome === regiao.nome)!;
    for (let i = 0; i < 16; i++) {
      const categoria = categorias[(i + 2) % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      const diasAtras = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - diasAtras);
      const resolvedAt =
        status === "resolvida"
          ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

      maisDemandas.push({
        categoria,
        descricao: `Demanda ${tipos[i % 3]} de ${categoria} - ${regiao.nome} (${i + 1})`,
        tipo: tipos[i % 3],
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        responsavel: responsaveis[i % responsaveis.length],
        regiaoId: regiao.id,
        latitude: coordsRegiao.latitude + (Math.random() - 0.5) * 0.05,
        longitude: coordsRegiao.longitude + (Math.random() - 0.5) * 0.05,
        createdAt,
        resolvedAt,
        bairroId: null,
      });
    }
  }

  await prisma.demanda.createMany({ data: maisDemandas });
```

Also update the existing demandas creation to include `tipo`, `responsavel`, and `bairroId` fields (add them to the `demandasData.push` call).

Replace the existing demandas creation (lines ~143-167) with:

```ts
  const tipos = ["emergencial", "rotina", "projeto"];
  const responsaveis = ["Carlos Silva", "Ana Oliveira", "Pedro Santos", "Maria Costa", "João Souza"];

  for (const regiao of regioes) {
    const coordsRegiao = regioesSP.find((r) => r.nome === regiao.nome)!;
    for (let i = 0; i < 34; i++) {
      const categoria = categorias[i % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      const diasAtras = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - diasAtras);
      const resolvedAt =
        status === "resolvida"
          ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

      demandasData.push({
        categoria,
        descricao: `Demanda de ${categoria} na ${regiao.nome} - registro ${i + 1}`,
        tipo: tipos[i % 3],
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        responsavel: responsaveis[i % responsaveis.length],
        regiaoId: regiao.id,
        latitude: coordsRegiao.latitude + (Math.random() - 0.5) * 0.05,
        longitude: coordsRegiao.longitude + (Math.random() - 0.5) * 0.05,
        createdAt,
        resolvedAt,
        bairroId: null,
      });
    }
  }
```

**Step 2:** Update the DemandaData type to include new fields

Replace the `demandasData` variable type annotation to include the new fields:

```ts
  const demandasData: {
    categoria: string;
    descricao: string;
    tipo: string;
    status: string;
    prioridade: number;
    responsavel: string;
    regiaoId: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    resolvedAt: Date | null;
    bairroId: null;
  }[] = [];
```

**Step 3:** Run seed

```bash
cd /var/www/html/mapeamento && npx prisma db seed 2>&1
```

**Step 4:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: seed additional demandas with tipo and responsavel"
```

---

### Task 4: Install drag & drop dependency

**Files:**
- Modify: `package.json`

**Step 1:** Install @hello-pangea/dnd (maintained fork of react-beautiful-dnd)

```bash
cd /var/www/html/mapeamento && npm install @hello-pangea/dnd 2>&1
```

**Step 2:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add @hello-pangea/dnd for kanban drag and drop"
```

---

### Task 5: FiltrosDemandas and TabelaDemandas components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/demandas/FiltrosDemandas.tsx`
- Create: `/var/www/html/mapeamento/src/components/demandas/TabelaDemandas.tsx`

**Step 1:** Write FiltrosDemandas

Write to `/var/www/html/mapeamento/src/components/demandas/FiltrosDemandas.tsx`:

```tsx
"use client";

import { Search, Filter } from "lucide-react";

interface FiltrosDemandasProps {
  status: string;
  categoria: string;
  regiaoId: string;
  busca: string;
  onStatusChange: (v: string) => void;
  onCategoriaChange: (v: string) => void;
  onRegiaoChange: (v: string) => void;
  onBuscaChange: (v: string) => void;
}

const categorias = ["iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento"];
const statusList = ["aberta", "em_andamento", "resolvida"];

export function FiltrosDemandas({
  status, categoria, regiaoId, busca,
  onStatusChange, onCategoriaChange, onRegiaoChange, onBuscaChange,
}: FiltrosDemandasProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos status</option>
        {statusList.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
      <select
        value={categoria}
        onChange={(e) => onCategoriaChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todas categorias</option>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={regiaoId}
        onChange={(e) => onRegiaoChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todas regiões</option>
      </select>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por descrição..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
```

**Step 2:** Write TabelaDemandas

Write to `/var/www/html/mapeamento/src/components/demandas/TabelaDemandas.tsx`:

```tsx
"use client";

import { ArrowUpDown } from "lucide-react";
import type { DemandaType } from "@/types/demandas";

interface TabelaDemandasProps {
  demandas: DemandaType[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (demanda: DemandaType) => void;
}

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
};

const statusColors: Record<string, string> = {
  aberta: "text-red-600",
  em_andamento: "text-amber-600",
  resolvida: "text-green-600",
};

export function TabelaDemandas({ demandas, total, page, totalPages, onPageChange, onSelect }: TabelaDemandasProps) {
  if (demandas.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-muted-foreground">
        Nenhuma demanda encontrada.
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground">Prioridade</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Responsável</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {demandas.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelect(d)}
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition"
              >
                <td className="p-3">{d.prioridade}</td>
                <td className="p-3 max-w-[250px] truncate">{d.descricao}</td>
                <td className="p-3 capitalize">{d.categoria}</td>
                <td className="p-3">
                  <span className={`font-medium ${statusColors[d.status] || ""}`}>
                    {statusLabels[d.status] || d.status}
                  </span>
                </td>
                <td className="p-3">{d.responsavel || "-"}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-border text-sm">
          <span className="text-muted-foreground">{total} demanda(s)</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">{page} de {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add FiltrosDemandas and TabelaDemandas components"
```

---

### Task 6: CardDemanda and KanbanDemandas components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/demandas/CardDemanda.tsx`
- Create: `/var/www/html/mapeamento/src/components/demandas/KanbanDemandas.tsx`

**Step 1:** Write CardDemanda

Write to `/var/www/html/mapeamento/src/components/demandas/CardDemanda.tsx`:

```tsx
"use client";

import { Draggable } from "@hello-pangea/dnd";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { DemandaType } from "@/types/demandas";

interface CardDemandaProps {
  demanda: DemandaType;
  index: number;
  onClick: () => void;
}

const prioridadeIcon = (p: number) => {
  if (p >= 4) return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (p >= 2) return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
};

export function CardDemanda({ demanda, index, onClick }: CardDemandaProps) {
  return (
    <Draggable draggableId={demanda.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-card rounded-lg p-3 border border-border cursor-pointer transition ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium capitalize text-muted-foreground">
              {demanda.categoria}
            </span>
            {prioridadeIcon(demanda.prioridade)}
          </div>
          <p className="text-sm leading-snug line-clamp-2">{demanda.descricao}</p>
          {demanda.responsavel && (
            <p className="text-xs text-muted-foreground mt-2">{demanda.responsavel}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}
```

**Step 2:** Write KanbanDemandas

Write to `/var/www/html/mapeamento/src/components/demandas/KanbanDemandas.tsx`:

```tsx
"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { CardDemanda } from "./CardDemanda";
import type { DemandaType } from "@/types/demandas";

interface KanbanDemandasProps {
  demandas: DemandaType[];
  onStatusChange: (id: string, newStatus: string) => void;
  onSelect: (demanda: DemandaType) => void;
}

const columns = [
  { id: "aberta", label: "Aberta", color: "border-red-400" },
  { id: "em_andamento", label: "Em Andamento", color: "border-amber-400" },
  { id: "resolvida", label: "Resolvida", color: "border-green-400" },
];

export function KanbanDemandas({ demandas, onStatusChange, onSelect }: KanbanDemandasProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;
    onStatusChange(result.draggableId, result.destination.droppableId);
  };

  const getDemandasPorColuna = (status: string) =>
    demandas.filter((d) => d.status === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`glass rounded-xl p-3 border-t-4 ${col.color}`}
          >
            <h3 className="font-semibold text-sm mb-3 px-1">
              {col.label}
              <span className="text-muted-foreground font-normal ml-2">
                ({getDemandasPorColuna(col.id).length})
              </span>
            </h3>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[200px] rounded-lg p-1 transition ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {getDemandasPorColuna(col.id).map((d, idx) => (
                    <CardDemanda
                      key={d.id}
                      demanda={d}
                      index={idx}
                      onClick={() => onSelect(d)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add CardDemanda and KanbanDemandas components"
```

---

### Task 7: FormularioDemanda and ModalDemanda components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/demandas/FormularioDemanda.tsx`
- Create: `/var/www/html/mapeamento/src/components/demandas/ModalDemanda.tsx`

**Step 1:** Write FormularioDemanda

Write to `/var/www/html/mapeamento/src/components/demandas/FormularioDemanda.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { DemandaFormData, DemandaType } from "@/types/demandas";

interface FormularioDemandaProps {
  demanda?: DemandaType | null;
  onSaved: () => void;
  onCancel: () => void;
}

const categorias = ["iluminação", "pavimentação", "saúde", "educação", "segurança", "saneamento"];
const tipos = ["emergencial", "rotina", "projeto"];
const statusList = ["aberta", "em_andamento", "resolvida"];

export function FormularioDemanda({ demanda, onSaved, onCancel }: FormularioDemandaProps) {
  const [formData, setFormData] = useState<DemandaFormData>({
    categoria: "",
    descricao: "",
    tipo: "rotina",
    status: "aberta",
    prioridade: 0,
    responsavel: "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (demanda) {
      setFormData({
        categoria: demanda.categoria,
        descricao: demanda.descricao,
        tipo: demanda.tipo,
        status: demanda.status,
        prioridade: demanda.prioridade,
        responsavel: demanda.responsavel || "",
      });
    }
  }, [demanda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const url = demanda ? `/api/demandas/${demanda.id}` : "/api/demandas";
      const method = demanda ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData((p) => ({ ...p, categoria: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {statusList.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prioridade (1-5)</label>
          <input
            type="number"
            min={0}
            max={5}
            value={formData.prioridade}
            onChange={(e) => setFormData((p) => ({ ...p, prioridade: parseInt(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Responsável</label>
        <input
          type="text"
          value={formData.responsavel || ""}
          onChange={(e) => setFormData((p) => ({ ...p, responsavel: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {salvando ? "Salvando..." : demanda ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2:** Write ModalDemanda

Write to `/var/www/html/mapeamento/src/components/demandas/ModalDemanda.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Trash2, Edit3 } from "lucide-react";
import { FormularioDemanda } from "./FormularioDemanda";
import type { DemandaType } from "@/types/demandas";

interface ModalDemandaProps {
  demanda: DemandaType | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
};

export function ModalDemanda({ demanda, open, onClose, onSaved, onDeleted }: ModalDemandaProps) {
  const [editando, setEditando] = useState(false);

  if (!open || !demanda) return null;

  const handleDelete = async () => {
    if (!confirm("Excluir esta demanda?")) return;
    await fetch(`/api/demandas/${demanda.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editando ? "Editar Demanda" : "Detalhes da Demanda"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {editando ? (
          <FormularioDemanda
            demanda={demanda}
            onSaved={() => { setEditando(false); onSaved(); }}
            onCancel={() => setEditando(false)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm font-medium">{demanda.descricao}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="text-sm font-medium capitalize">{demanda.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{demanda.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{statusLabels[demanda.status] || demanda.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <p className="text-sm font-medium">{demanda.prioridade}/5</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="text-sm font-medium">{demanda.responsavel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="text-sm font-medium">
                  {new Date(demanda.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            {demanda.resolvedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Resolvida em</p>
                <p className="text-sm font-medium">
                  {new Date(demanda.resolvedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add FormularioDemanda and ModalDemanda components"
```

---

### Task 8: Main page and layout

**Files:**
- Create: `/var/www/html/mapeamento/src/app/demandas/layout.tsx`
- Create: `/var/www/html/mapeamento/src/app/demandas/page.tsx`

**Step 1:** Write layout

Write to `/var/www/html/mapeamento/src/app/demandas/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão de Demandas | Cassol Mapeamento Regional",
};

export default function DemandasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 2:** Write main page

Write to `/var/www/html/mapeamento/src/app/demandas/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutList, Columns3 } from "lucide-react";
import { FiltrosDemandas } from "@/components/demandas/FiltrosDemandas";
import { TabelaDemandas } from "@/components/demandas/TabelaDemandas";
import { KanbanDemandas } from "@/components/demandas/KanbanDemandas";
import { FormularioDemanda } from "@/components/demandas/FormularioDemanda";
import { ModalDemanda } from "@/components/demandas/ModalDemanda";
import type { DemandaType, DemandaListResponse } from "@/types/demandas";

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<DemandaType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [regiaoId, setRegiaoId] = useState("");
  const [busca, setBusca] = useState("");
  const [modoKanban, setModoKanban] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCriar, setModalCriar] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<DemandaType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDemandas = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (status) params.set("status", status);
    if (categoria) params.set("categoria", categoria);
    if (regiaoId) params.set("regiaoId", regiaoId);
    if (busca) params.set("busca", busca);

    const res = await fetch(`/api/demandas?${params}`);
    const data: DemandaListResponse = await res.json();
    setDemandas(data.demandas);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [page, status, categoria, regiaoId, busca]);

  useEffect(() => {
    fetchDemandas();
  }, [fetchDemandas, refreshKey]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/demandas/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleSaved = () => {
    setModalAberto(false);
    setModalCriar(false);
    setDemandaSelecionada(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleted = () => {
    setModalAberto(false);
    setDemandaSelecionada(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestão de Demandas</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setModoKanban(!modoKanban)}
              className="glass rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-muted transition"
            >
              {modoKanban ? <LayoutList className="w-4 h-4" /> : <Columns3 className="w-4 h-4" />}
              {modoKanban ? "Tabela" : "Kanban"}
            </button>
            <button
              onClick={() => setModalCriar(true)}
              className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nova Demanda
            </button>
          </div>
        </div>

        <FiltrosDemandas
          status={status}
          categoria={categoria}
          regiaoId={regiaoId}
          busca={busca}
          onStatusChange={(v) => { setStatus(v); setPage(1); }}
          onCategoriaChange={(v) => { setCategoria(v); setPage(1); }}
          onRegiaoChange={(v) => { setRegiaoId(v); setPage(1); }}
          onBuscaChange={(v) => { setBusca(v); setPage(1); }}
        />

        {modoKanban ? (
          <KanbanDemandas
            demandas={demandas}
            onStatusChange={handleStatusChange}
            onSelect={(d) => { setDemandaSelecionada(d); setModalAberto(true); }}
          />
        ) : (
          <TabelaDemandas
            demandas={demandas}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelect={(d) => { setDemandaSelecionada(d); setModalAberto(true); }}
          />
        )}
      </div>

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Nova Demanda</h3>
            <FormularioDemanda onSaved={handleSaved} onCancel={() => setModalCriar(false)} />
          </div>
        </div>
      )}

      <ModalDemanda
        demanda={demandaSelecionada}
        open={modalAberto}
        onClose={() => { setModalAberto(false); setDemandaSelecionada(null); }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
```

**Step 3:** Verify build

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -25
```

**Step 4:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add demandas main page with layout"
```

---

## Self-Review

**1. Spec coverage:**
- Schema expandido com `responsavel`/`tipo` → Task 1
- API CRUD completo → Task 2
- Seed com mais demandas → Task 3
- Filtros + Tabela → Task 5
- Kanban com drag & drop → Tasks 4 + 6
- Formulário + Modal detalhes → Task 7
- Página principal → Task 8

**2. No placeholders:** All steps have complete executable code and exact commands.

**3. Type consistency:** `DemandaType`, `DemandaListResponse`, `DemandaFormData` defined in Task 2 match usage across Tasks 5-8.
