# CRM Comunitário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build community CRM with contact registration and interaction timeline.

**Architecture:** Expand Prisma schema with Contato + Interacao models, add CRUD API routes under `/api/crm/`, build React components for listing, timeline, forms, modals, and a single page at `/crm`.

**Tech Stack:** Next.js 16, Prisma 7, ShadCN UI, Lucide React

---

## File Structure

```
src/
├── app/crm/
│   ├── page.tsx                   # Página principal
│   └── layout.tsx                 # Metadata
│   └── api/crm/
│       ├── contatos/route.ts      # GET (list) + POST (create)
│       └── contatos/[id]/route.ts # GET + PUT + DELETE
│       └── interacoes/route.ts    # GET (by contatoId) + POST
├── components/crm/
│   ├── ListaContatos.tsx          # Tabela com busca
│   ├── TimelineInteracoes.tsx     # Timeline vertical
│   ├── FormularioContato.tsx      # Form criar/editar contato
│   ├── FormularioInteracao.tsx    # Form registrar interação
│   └── ModalContato.tsx           # Modal detalhes + timeline
└── types/
    └── crm.ts                     # Interfaces
```

---

### Task 1: Add Contato and Interacao models

**Files:**
- Modify: `/var/www/html/mapeamento/prisma/schema.prisma`

**Step 1:** Add the two new models before model Demanda

Insert at line ~82 (before `model Demanda {`):

```prisma
model Contato {
  id            String      @id @default(cuid())
  nome          String
  telefone      String
  email         String?
  cargo         String?
  redesSociais  Json?
  bairroId      String?
  bairro        Bairro?     @relation(fields: [bairroId], references: [id])
  comunidadeId  String?
  comunidade    Comunidade? @relation(fields: [comunidadeId], references: [id])
  observacoes   String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  interacoes    Interacao[]
}

model Interacao {
  id          String   @id @default(cuid())
  tipo        String
  descricao   String   @db.Text
  data        DateTime
  responsavel String
  contatoId   String
  contato     Contato  @relation(fields: [contatoId], references: [id])
  demandaId   String?
  demanda     Demanda? @relation(fields: [demandaId], references: [id])
  createdAt   DateTime @default(now())
}
```

**Step 2:** Apply migration

```bash
cd /var/www/html/mapeamento && npx prisma migrate dev --name add-crm 2>&1
```

**Step 3:** Regenerate client

```bash
cd /var/www/html/mapeamento && npx prisma generate 2>&1
```

**Step 4:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add Contato and Interacao models"
```

---

### Task 2: Types and API routes

**Files:**
- Create: `/var/www/html/mapeamento/src/types/crm.ts`
- Create: `/var/www/html/mapeamento/src/app/api/crm/contatos/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/crm/contatos/[id]/route.ts`
- Create: `/var/www/html/mapeamento/src/app/api/crm/interacoes/route.ts`

**Step 1:** Write types

Write to `/var/www/html/mapeamento/src/types/crm.ts`:

```ts
export interface ContatoType {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cargo: string | null;
  redesSociais: Record<string, string> | null;
  bairroId: string | null;
  comunidadeId: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InteracaoType {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
  responsavel: string;
  contatoId: string;
  demandaId: string | null;
  createdAt: string;
}

export interface ContatoFormData {
  nome: string;
  telefone: string;
  email?: string;
  cargo?: string;
  redesSociais?: string;
  bairroId?: string;
  comunidadeId?: string;
  observacoes?: string;
}

export interface InteracaoFormData {
  tipo: string;
  descricao: string;
  data: string;
  responsavel: string;
  contatoId: string;
  demandaId?: string;
}
```

**Step 2:** Create API directories

```bash
mkdir -p /var/www/html/mapeamento/src/app/api/crm/contatos/\[id\] /var/www/html/mapeamento/src/app/api/crm/interacoes
```

**Step 3:** Write contatos list/create route

Write to `/var/www/html/mapeamento/src/app/api/crm/contatos/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca");
  const bairroId = searchParams.get("bairroId");

  const where: Record<string, unknown> = {};
  if (busca) where.nome = { contains: busca, mode: "insensitive" };
  if (bairroId) where.bairroId = bairroId;

  const contatos = await prisma.contato.findMany({
    where,
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(contatos);
}

export async function POST(request: Request) {
  const data = await request.json();
  const contato = await prisma.contato.create({
    data: {
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || null,
      cargo: data.cargo || null,
      redesSociais: data.redesSociais ? JSON.parse(data.redesSociais) : null,
      bairroId: data.bairroId || null,
      comunidadeId: data.comunidadeId || null,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(contato, { status: 201 });
}
```

**Step 4:** Write contatos detail/update/delete route

Write to `/var/www/html/mapeamento/src/app/api/crm/contatos/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contato = await prisma.contato.findUnique({
    where: { id },
    include: { interacoes: { orderBy: { data: "desc" } } },
  });
  if (!contato) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contato);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const contato = await prisma.contato.update({
    where: { id },
    data: {
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || null,
      cargo: data.cargo || null,
      redesSociais: data.redesSociais ? JSON.parse(data.redesSociais) : null,
      bairroId: data.bairroId || null,
      comunidadeId: data.comunidadeId || null,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(contato);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contato.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**Step 5:** Write interacoes routes

Write to `/var/www/html/mapeamento/src/app/api/crm/interacoes/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contatoId = searchParams.get("contatoId");
  if (!contatoId) return NextResponse.json({ error: "contatoId required" }, { status: 400 });
  const interacoes = await prisma.interacao.findMany({
    where: { contatoId },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(interacoes);
}

export async function POST(request: Request) {
  const data = await request.json();
  const interacao = await prisma.interacao.create({
    data: {
      tipo: data.tipo,
      descricao: data.descricao,
      data: new Date(data.data),
      responsavel: data.responsavel,
      contatoId: data.contatoId,
      demandaId: data.demandaId || null,
    },
  });
  return NextResponse.json(interacao, { status: 201 });
}
```

**Step 6:** Build check

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -20
```

**Step 7:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add crm types and api routes"
```

---

### Task 3: Seed CRM data

**Files:**
- Modify: `/var/www/html/mapeamento/prisma/seed.ts`

**Step 1:** Add seed data before the `console.log` at end of `main()`

Add after `await prisma.visita.createMany({ data: visitasData });`:

```ts
  // CRM seed
  await prisma.interacao.deleteMany();
  await prisma.contato.deleteMany();

  const todosBairros = await prisma.bairro.findMany();
  const responsaveis = ["Carlos Silva", "Ana Oliveira", "Pedro Santos"];

  const contatosData = [
    { nome: "Maria Silva", telefone: "(11) 99999-0001", email: "maria@email.com", cargo: "Líder Comunitária", bairroId: todosBairros[0]?.id || null },
    { nome: "João Santos", telefone: "(11) 99999-0002", email: "joao@email.com", cargo: "Presidente da Associação", bairroId: todosBairros[1]?.id || null },
    { nome: "Ana Costa", telefone: "(11) 99999-0003", email: null, cargo: "Representante de Rua", bairroId: todosBairros[2]?.id || null },
    { nome: "Carlos Pereira", telefone: "(11) 99999-0004", email: "carlos@email.com", cargo: "Vice-líder", bairroId: todosBairros[3]?.id || null },
    { nome: "Lucia Oliveira", telefone: "(11) 99999-0005", email: null, cargo: "Voluntária", bairroId: todosBairros[4]?.id || null },
    { nome: "Pedro Souza", telefone: "(11) 99999-0006", email: "pedro@email.com", cargo: "Membro do Conselho", bairroId: todosBairros[5]?.id || null },
    { nome: "Marina Lima", telefone: "(11) 99999-0007", email: "marina@email.com", cargo: "Líder Juvenil", bairroId: todosBairros[6]?.id || null },
    { nome: "Roberto Alves", telefone: "(11) 99999-0008", email: null, cargo: "Comerciante Local", bairroId: todosBairros[7]?.id || null },
    { nome: "Carla Mendes", telefone: "(11) 99999-0009", email: "carla@email.com", cargo: "Professora", bairroId: todosBairros[8]?.id || null },
    { nome: "Fernando Dias", telefone: "(11) 99999-0010", email: null, cargo: "Aposentado", bairroId: todosBairros[0]?.id || null },
  ];

  for (const c of contatosData) {
    const contato = await prisma.contato.create({ data: c });

    const numInteracoes = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numInteracoes; i++) {
      const diasAtras = Math.floor(Math.random() * 60);
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      const tipos = ["visita", "ligacao", "reuniao", "mensagem"];
      await prisma.interacao.create({
        data: {
          tipo: tipos[i % 4],
          descricao: `${tipos[i % 4].charAt(0).toUpperCase() + tipos[i % 4].slice(1)} com ${c.nome} - ${["Discussão sobre demandas", "Acompanhamento de obra", "Reunião de planejamento", "Contato de rotina"][i % 4]}`,
          data,
          responsavel: responsaveis[i % responsaveis.length],
          contatoId: contato.id,
        },
      });
    }
  }
```

**Step 2:** Run seed

```bash
cd /var/www/html/mapeamento && npx prisma db seed 2>&1
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: seed crm contatos and interacoes"
```

---

### Task 4: ListaContatos component

**Files:**
- Create: `/var/www/html/mapeamento/src/components/crm/ListaContatos.tsx`

**Step 1:** Write component

Write to `/var/www/html/mapeamento/src/components/crm/ListaContatos.tsx`:

```tsx
"use client";

import { Search, Phone, Mail } from "lucide-react";
import type { ContatoType } from "@/types/crm";

interface ListaContatosProps {
  contatos: ContatoType[];
  busca: string;
  onBuscaChange: (v: string) => void;
  onSelect: (contato: ContatoType) => void;
}

export function ListaContatos({ contatos, busca, onBuscaChange, onSelect }: ListaContatosProps) {
  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {contatos.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cargo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Contato</th>
                </tr>
              </thead>
              <tbody>
                {contatos.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition"
                  >
                    <td className="p-3 font-medium">{c.nome}</td>
                    <td className="p-3">{c.telefone}</td>
                    <td className="p-3 text-muted-foreground">{c.cargo || "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {c.email && <Mail className="w-4 h-4 text-muted-foreground" />}
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border text-sm text-muted-foreground">
            {contatos.length} contato(s)
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add ListaContatos component"
```

---

### Task 5: TimelineInteracoes and FormularioInteracao components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/crm/TimelineInteracoes.tsx`
- Create: `/var/www/html/mapeamento/src/components/crm/FormularioInteracao.tsx`

**Step 1:** Write TimelineInteracoes

Write to `/var/www/html/mapeamento/src/components/crm/TimelineInteracoes.tsx`:

```tsx
"use client";

import { Phone, Mail, Users, MessageSquare } from "lucide-react";
import type { InteracaoType } from "@/types/crm";

interface TimelineInteracoesProps {
  interacoes: InteracaoType[];
}

const tipoIcon: Record<string, React.ReactNode> = {
  visita: <Users className="w-4 h-4" />,
  ligacao: <Phone className="w-4 h-4" />,
  reuniao: <Users className="w-4 h-4" />,
  mensagem: <MessageSquare className="w-4 h-4" />,
};

const tipoLabel: Record<string, string> = {
  visita: "Visita",
  ligacao: "Ligação",
  reuniao: "Reunião",
  mensagem: "Mensagem",
};

export function TimelineInteracoes({ interacoes }: TimelineInteracoesProps) {
  if (interacoes.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nenhuma interação registrada.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2.5 top-1 bottom-0 w-px bg-border" />
      {interacoes.map((i) => (
        <div key={i.id} className="relative">
          <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-brand-600 ring-2 ring-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-brand-600">{tipoIcon[i.tipo] || <MessageSquare className="w-4 h-4" />}</span>
              <span className="text-xs font-medium">{tipoLabel[i.tipo] || i.tipo}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(i.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <p className="text-sm">{i.descricao}</p>
            <p className="text-xs text-muted-foreground mt-1">por {i.responsavel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2:** Write FormularioInteracao

Write to `/var/www/html/mapeamento/src/components/crm/FormularioInteracao.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { InteracaoFormData } from "@/types/crm";

interface FormularioInteracaoProps {
  contatoId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const tipos = ["visita", "ligacao", "reuniao", "mensagem"];

export function FormularioInteracao({ contatoId, onSaved, onCancel }: FormularioInteracaoProps) {
  const [formData, setFormData] = useState<InteracaoFormData>({
    tipo: "visita",
    descricao: "",
    data: new Date().toISOString().slice(0, 10),
    responsavel: "",
    contatoId,
  });
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch("/api/crm/interacoes", {
        method: "POST",
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
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            value={formData.data}
            onChange={(e) => setFormData((p) => ({ ...p, data: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Responsável</label>
          <input
            type="text"
            value={formData.responsavel}
            onChange={(e) => setFormData((p) => ({ ...p, responsavel: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
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
          {salvando ? "Salvando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add TimelineInteracoes and FormularioInteracao components"
```

---

### Task 6: FormularioContato and ModalContato components

**Files:**
- Create: `/var/www/html/mapeamento/src/components/crm/FormularioContato.tsx`
- Create: `/var/www/html/mapeamento/src/components/crm/ModalContato.tsx`

**Step 1:** Write FormularioContato

Write to `/var/www/html/mapeamento/src/components/crm/FormularioContato.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { ContatoFormData, ContatoType } from "@/types/crm";

interface FormularioContatoProps {
  contato?: ContatoType | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function FormularioContato({ contato, onSaved, onCancel }: FormularioContatoProps) {
  const [formData, setFormData] = useState<ContatoFormData>({
    nome: "",
    telefone: "",
    email: "",
    cargo: "",
    redesSociais: "",
    bairroId: "",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (contato) {
      setFormData({
        nome: contato.nome,
        telefone: contato.telefone,
        email: contato.email || "",
        cargo: contato.cargo || "",
        redesSociais: contato.redesSociais ? JSON.stringify(contato.redesSociais) : "",
        bairroId: contato.bairroId || "",
        observacoes: contato.observacoes || "",
      });
    }
  }, [contato]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const url = contato ? `/api/crm/contatos/${contato.id}` : "/api/crm/contatos";
      const method = contato ? "PUT" : "POST";
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone *</label>
          <input
            type="text"
            value={formData.telefone}
            onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cargo</label>
          <input
            type="text"
            value={formData.cargo || ""}
            onChange={(e) => setFormData((p) => ({ ...p, cargo: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Redes Sociais (JSON)</label>
        <input
          type="text"
          value={formData.redesSociais || ""}
          onChange={(e) => setFormData((p) => ({ ...p, redesSociais: e.target.value }))}
          placeholder='{"instagram": "@usuario", "facebook": "usuario"}'
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <textarea
          value={formData.observacoes || ""}
          onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[60px]"
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
          {salvando ? "Salvando..." : contato ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2:** Write ModalContato

Write to `/var/www/html/mapeamento/src/components/crm/ModalContato.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Edit3, Phone, Mail, Globe, Plus } from "lucide-react";
import { TimelineInteracoes } from "./TimelineInteracoes";
import { FormularioInteracao } from "./FormularioInteracao";
import { FormularioContato } from "./FormularioContato";
import type { ContatoType, InteracaoType } from "@/types/crm";

interface ModalContatoProps {
  contato: ContatoType | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ModalContato({ contato, open, onClose, onSaved, onDeleted }: ModalContatoProps) {
  const [editando, setEditando] = useState(false);
  const [novaInteracao, setNovaInteracao] = useState(false);
  const [interacoes, setInteracoes] = useState<InteracaoType[]>([]);

  useEffect(() => {
    if (contato && open && !editando) {
      fetch(`/api/crm/interacoes?contatoId=${contato.id}`)
        .then((r) => r.json())
        .then(setInteracoes);
    }
  }, [contato, open, editando]);

  if (!open || !contato) return null;

  const handleDelete = async () => {
    if (!confirm("Excluir este contato?")) return;
    await fetch(`/api/crm/contatos/${contato.id}`, { method: "DELETE" });
    onDeleted();
  };

  const redesSociais = contato.redesSociais
    ? (typeof contato.redesSociais === "string" ? JSON.parse(contato.redesSociais) : contato.redesSociais)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {editando ? "Editar Contato" : contato.nome}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {editando ? (
          <FormularioContato
            contato={contato}
            onSaved={() => { setEditando(false); onSaved(); }}
            onCancel={() => setEditando(false)}
          />
        ) : novaInteracao ? (
          <FormularioInteracao
            contatoId={contato.id}
            onSaved={() => { setNovaInteracao(false); onSaved(); }}
            onCancel={() => setNovaInteracao(false)}
          />
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{contato.telefone}</span>
              </div>
              {contato.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{contato.email}</span>
                </div>
              )}
              {contato.cargo && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">{contato.cargo}</span>
                </div>
              )}
              {redesSociais && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{Object.entries(redesSociais).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>
                </div>
              )}
              {contato.observacoes && (
                <p className="text-sm text-muted-foreground italic">{contato.observacoes}</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Interações</h4>
                <button
                  onClick={() => setNovaInteracao(true)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova
                </button>
              </div>
              <TimelineInteracoes interacoes={interacoes} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border mt-4">
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
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 3:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add FormularioContato and ModalContato components"
```

---

### Task 7: Main page and layout

**Files:**
- Create: `/var/www/html/mapeamento/src/app/crm/layout.tsx`
- Create: `/var/www/html/mapeamento/src/app/crm/page.tsx`

**Step 1:** Write layout

Write to `/var/www/html/mapeamento/src/app/crm/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM Comunitário | Cassol Mapeamento Regional",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 2:** Write main page

Write to `/var/www/html/mapeamento/src/app/crm/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { ListaContatos } from "@/components/crm/ListaContatos";
import { ModalContato } from "@/components/crm/ModalContato";
import { FormularioContato } from "@/components/crm/FormularioContato";
import type { ContatoType } from "@/types/crm";

export default function CrmPage() {
  const [contatos, setContatos] = useState<ContatoType[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCriar, setModalCriar] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchContatos = useCallback(async () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    const res = await fetch(`/api/crm/contatos?${params}`);
    const data = await res.json();
    setContatos(data);
  }, [busca]);

  useEffect(() => {
    fetchContatos();
  }, [fetchContatos, refreshKey]);

  const handleSaved = () => {
    setModalAberto(false);
    setModalCriar(false);
    setContatoSelecionado(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleted = () => {
    setModalAberto(false);
    setContatoSelecionado(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold">CRM Comunitário</h1>
          </div>
          <button
            onClick={() => setModalCriar(true)}
            className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>

        <ListaContatos
          contatos={contatos}
          busca={busca}
          onBuscaChange={(v) => setBusca(v)}
          onSelect={(c) => { setContatoSelecionado(c); setModalAberto(true); }}
        />
      </div>

      {modalCriar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Novo Contato</h3>
            <FormularioContato onSaved={handleSaved} onCancel={() => setModalCriar(false)} />
          </div>
        </div>
      )}

      <ModalContato
        contato={contatoSelecionado}
        open={modalAberto}
        onClose={() => { setModalAberto(false); setContatoSelecionado(null); }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
```

**Step 3:** Build check

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -25
```

**Step 4:** Commit

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add crm main page with layout"
```

---

## Self-Review

**1. Spec coverage:**
- Schema Contato + Interacao → Task 1
- Types + API routes → Task 2
- Seed data → Task 3
- ListaContatos → Task 4
- Timeline + FormularioInteracao → Task 5
- FormularioContato + ModalContato → Task 6
- Main page → Task 7

**2. No placeholders:** All steps have complete executable code and exact commands.

**3. Type consistency:** `ContatoType`, `InteracaoType`, `ContatoFormData`, `InteracaoFormData` defined in Task 2 match usage across Tasks 4-7.
