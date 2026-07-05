# Upload de Anexos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar upload de anexos a demandas, contatos e interações do CRM.

**Architecture:** Modelo polimórfico `Anexo` com `entidadeTipo` + `entidadeId`. Arquivos salvos em `uploads/<ano>/<mes>/<uuid>-<nomeOriginal>`. Servidos via API autenticada.

**Tech Stack:** Next.js 16 App Router, Prisma 7, FormData nativo, fs nativo.

---

### Task 1: Modelo Anexo + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

- [ ] **Adicionar modelo Anexo ao schema**

```prisma
model Anexo {
  id           String   @id @default(cuid())
  nomeOriginal String
  nomeArquivo  String   @unique
  tamanho      Int
  mimeType     String
  entidadeTipo String
  entidadeId   String
  criadoPor    String?
  createdAt    DateTime @default(now())
}
```

Inserir após o modelo `Interacao`, antes do modelo `Demanda`.

- [ ] **Gerar migration e compilar**

```bash
cd /var/www/html/mapeamento
npx prisma migrate dev --name add_anexo
npx prisma generate
```

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Anexo model"
```

---

### Task 2: Types Anexo

**Files:**
- Create: `src/types/anexos.ts`

- [ ] **Criar arquivo de tipos**

```ts
export interface AnexoType {
  id: string;
  nomeOriginal: string;
  nomeArquivo: string;
  tamanho: number;
  mimeType: string;
  entidadeTipo: "demanda" | "contato" | "interacao";
  entidadeId: string;
  criadoPor: string | null;
  createdAt: string;
}

export type EntidadeTipo = AnexoType["entidadeTipo"];
```

- [ ] **Commit**

```bash
git add src/types/anexos.ts
git commit -m "feat: add anexos types"
```

---

### Task 3: API — POST /api/anexos (Upload)

**Files:**
- Create: `src/app/api/anexos/route.ts`

- [ ] **Criar route POST**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ENTIDADES_VALIDAS = ["demanda", "contato", "interacao"] as const;

export async function POST(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File | null;
  const entidadeTipo = formData.get("entidadeTipo") as string;
  const entidadeId = formData.get("entidadeId") as string;

  if (!arquivo || !entidadeTipo || !entidadeId) {
    return NextResponse.json({ error: "arquivo, entidadeTipo e entidadeId são obrigatórios" }, { status: 400 });
  }

  if (!ENTIDADES_VALIDAS.includes(entidadeTipo as typeof ENTIDADES_VALIDAS[number])) {
    return NextResponse.json({ error: "entidadeTipo inválida" }, { status: 400 });
  }

  if (arquivo.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo excede 2MB" }, { status: 413 });
  }

  const extension = arquivo.name.split(".").pop() || "bin";
  const nomeArquivo = `${randomUUID()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const agora = new Date();
  const caminhoPasta = join(process.cwd(), "uploads", String(agora.getFullYear()), String(agora.getMonth() + 1).padStart(2, "0"));
  const caminhoCompleto = join(caminhoPasta, nomeArquivo);

  await mkdir(caminhoPasta, { recursive: true });
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(caminhoCompleto, buffer);

  const anexo = await prisma.anexo.create({
    data: {
      nomeOriginal: arquivo.name,
      nomeArquivo,
      tamanho: arquivo.size,
      mimeType: arquivo.type,
      entidadeTipo,
      entidadeId,
      criadoPor: session.user.nome || session.user.email,
    },
  });

  return NextResponse.json({
    id: anexo.id,
    nomeOriginal: anexo.nomeOriginal,
    nomeArquivo: anexo.nomeArquivo,
    tamanho: anexo.tamanho,
    mimeType: anexo.mimeType,
    createdAt: anexo.createdAt,
  }, { status: 201 });
}
```

- [ ] **Commit**

```bash
git add src/app/api/anexos/route.ts
git commit -m "feat: POST /api/anexos upload endpoint"
```

---

### Task 4: API — GET (list) + GET (download) + DELETE

**Files:**
- Create: `src/app/api/anexos/[id]/route.ts` (GET download + DELETE)
- Modify: `src/app/api/anexos/route.ts` (adicionar GET list)

- [ ] **Adicionar GET list no route.ts**

```ts
export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const entidadeTipo = searchParams.get("entidadeTipo");
  const entidadeId = searchParams.get("entidadeId");

  if (!entidadeTipo || !entidadeId) {
    return NextResponse.json({ error: "entidadeTipo e entidadeId são obrigatórios" }, { status: 400 });
  }

  const anexos = await prisma.anexo.findMany({
    where: { entidadeTipo, entidadeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nomeOriginal: true,
      tamanho: true,
      mimeType: true,
      criadoPor: true,
      createdAt: true,
    },
  });

  return NextResponse.json(anexos);
}
```

Inserir antes do POST (já que GET não depende do formData).

- [ ] **Criar route [id] com download + delete**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { readFile, unlink } from "fs/promises";
import { join } from "path";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caminho = join(process.cwd(), "uploads",
    anexo.createdAt.getFullYear().toString(),
    String(anexo.createdAt.getMonth() + 1).padStart(2, "0"),
    anexo.nomeArquivo,
  );

  try {
    const buffer = await readFile(caminho);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": anexo.mimeType,
        "Content-Disposition": `inline; filename="${anexo.nomeOriginal}"`,
        "Content-Length": String(anexo.tamanho),
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no disco" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "agente" && anexo.criadoPor !== session.user.nome && anexo.criadoPor !== session.user.email) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const caminho = join(process.cwd(), "uploads",
    anexo.createdAt.getFullYear().toString(),
    String(anexo.createdAt.getMonth() + 1).padStart(2, "0"),
    anexo.nomeArquivo,
  );

  await Promise.all([
    prisma.anexo.delete({ where: { id } }),
    unlink(caminho).catch(() => {}),
  ]);

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Commit**

```bash
git add src/app/api/anexos/route.ts src/app/api/anexos/
git commit -m "feat: GET/DELETE anexos endpoints"
```

---

### Task 5: Componente AnexosUpload

**Files:**
- Create: `src/components/anexos/AnexosUpload.tsx`

- [ ] **Criar componente de upload**

```tsx
"use client";

import { useRef, useState } from "react";
import { Upload, X, File } from "lucide-react";
import type { AnexoType, EntidadeTipo } from "@/types/anexos";

interface AnexosUploadProps {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  onUpload: (anexo: AnexoType) => void;
}

export function AnexosUpload({ entidadeTipo, entidadeId, onUpload }: AnexosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    setArquivo(file);
  };

  const handleUpload = async () => {
    if (!arquivo) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("entidadeTipo", entidadeTipo);
      formData.append("entidadeId", entidadeId);

      const res = await fetch("/api/anexos", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao fazer upload");
        return;
      }
      const anexo = await res.json();
      onUpload(anexo);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      alert("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      {!arquivo ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition"
        >
          <Upload className="w-4 h-4" />
          Adicionar anexo
        </button>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
          <File className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{arquivo.name}</span>
          <span className="text-xs text-muted-foreground">
            {(arquivo.size / 1024).toFixed(1)}KB
          </span>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700 transition disabled:opacity-50"
          >
            {uploading ? "..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => { setArquivo(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="p-1 hover:bg-muted rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/anexos/AnexosUpload.tsx
git commit -m "feat: AnexosUpload component"
```

---

### Task 6: Componente AnexosLista

**Files:**
- Create: `src/components/anexos/AnexosLista.tsx`

- [ ] **Criar componente de lista de anexos**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Trash2, FileText } from "lucide-react";
import type { AnexoType, EntidadeTipo } from "@/types/anexos";

interface AnexosListaProps {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  refreshKey?: number;
}

const formatTamanho = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export function AnexosLista({ entidadeTipo, entidadeId, refreshKey = 0 }: AnexosListaProps) {
  const [anexos, setAnexos] = useState<AnexoType[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/anexos?entidadeTipo=${entidadeTipo}&entidadeId=${entidadeId}`);
      if (res.ok) setAnexos(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [entidadeTipo, entidadeId]);

  useEffect(() => { carregar(); }, [carregar, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este anexo?")) return;
    const res = await fetch(`/api/anexos/${id}`, { method: "DELETE" });
    if (res.ok) setAnexos((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <p className="text-xs text-muted-foreground">Carregando anexos...</p>;
  if (anexos.length === 0) return null;

  return (
    <div className="space-y-1">
      {anexos.map((anexo) => (
        <div key={anexo.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm flex-1 truncate">{anexo.nomeOriginal}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatTamanho(anexo.tamanho)}</span>
          <a
            href={`/api/anexos/${anexo.id}/arquivo`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-muted rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => handleDelete(anexo.id)}
            className="p-1 hover:bg-red-50 rounded transition text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/anexos/AnexosLista.tsx
git commit -m "feat: AnexosLista component"
```

---

### Task 7: Integração Demandas

**Files:**
- Modify: `src/components/demandas/FormularioDemanda.tsx`
- Modify: `src/components/demandas/ModalDemanda.tsx`

- [ ] **Adicionar AnexosUpload no FormularioDemanda (após criação)**

Após salvar a demanda (quando `demanda.id` existe), adicionar upload de anexos. No caso de criação, a demanda já foi criada no servidor e temos o ID.

```tsx
// Adicionar import após os imports existentes:
import { AnexosUpload } from "@/components/anexos/AnexosUpload";
import { AnexosLista } from "@/components/anexos/AnexosLista";
```

Adicionar antes do `<div className="flex gap-3 justify-end pt-2">`:

```tsx
      {demanda && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-sm font-medium">Anexos</p>
          <AnexosLista entidadeTipo="demanda" entidadeId={demanda.id} />
          <AnexosUpload
            entidadeTipo="demanda"
            entidadeId={demanda.id}
            onUpload={() => {}}
          />
        </div>
      )}
```

- [ ] **Adicionar AnexosLista no ModalDemanda (modo leitura)**

Adicionar após a seção de `demanda.resolvedAt` (antes do `div.flex.gap-3.pt-2`):

```tsx
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-sm font-medium">Anexos</p>
              <AnexosLista entidadeTipo="demanda" entidadeId={demanda.id} />
            </div>
```

Com imports:

```tsx
import { AnexosLista } from "@/components/anexos/AnexosLista";
```

- [ ] **Commit**

```bash
git add src/components/demandas/FormularioDemanda.tsx src/components/demandas/ModalDemanda.tsx
git commit -m "feat: integrate anexos with demandas"
```

---

### Task 8: Integração CRM (Contato)

**Files:**
- Modify: `src/components/crm/ModalContato.tsx`

- [ ] **Adicionar AnexosUpload + AnexosLista no ModalContato**

Adicionar import:

```tsx
import { AnexosUpload } from "@/components/anexos/AnexosUpload";
import { AnexosLista } from "@/components/anexos/AnexosLista";
```

Adicionar após o bloco de observações e antes da seção de Interações (linha ~94):

```tsx
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <p className="text-sm font-medium">Anexos</p>
                <AnexosLista entidadeTipo="contato" entidadeId={contato.id} />
                <AnexosUpload
                  entidadeTipo="contato"
                  entidadeId={contato.id}
                  onUpload={() => {}}
                />
              </div>
```

- [ ] **Commit**

```bash
git add src/components/crm/ModalContato.tsx
git commit -m "feat: integrate anexos with CRM contatos"
```

---

### Task 9: .gitignore + Deploy

- [ ] **Adicionar uploads/ ao .gitignore**

```bash
echo "" >> /var/www/html/mapeamento/.gitignore
echo "# Uploads de anexos" >> /var/www/html/mapeamento/.gitignore
echo "uploads/" >> /var/www/html/mapeamento/.gitignore
git add .gitignore
git commit -m "chore: ignore uploads directory"
```

- [ ] **Build e deploy no servidor**

```bash
# Na máquina dev
cd /var/www/html/mapeamento
npm run build

# Verificar se builda sem erros
# Depois rsync para Contabo
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .env --exclude uploads \
  . root@164.68.110.35:/var/www/html/mapeamento/

# No servidor
ssh root@164.68.110.35 "cd /var/www/html/mapeamento && \
  npm install && \
  npx prisma generate && \
  npx prisma migrate deploy && \
  mkdir -p uploads && \
  npm run build && \
  systemctl restart mapeamento"
```

- [ ] **Commit final**

```bash
git add -A && git commit -m "feat: complete anexos upload module"
```
