# Autenticação e Autorização — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authentication (email+senha) and authorization (admin/agente roles) to all routes and APIs.

**Architecture:** Auth.js v5 with CredentialsProvider and JWT strategy. Prisma User model. Middleware protects pages; `withAuth` helper protects API routes with optional role check. Agent users see only records where they are the assigned `responsavel`.

**Tech Stack:** next-auth v5, bcryptjs, Prisma 7, Next.js 16 Middleware

---

## File Structure

```
Novos:
  src/lib/auth.ts                    # Auth.js config (authOptions, withAuth helper)
  src/types/auth.ts                  # SessionUser type
  src/app/api/auth/[...nextauth]/route.ts  # Auth.js catch-all handler
  src/app/login/page.tsx             # Login page
  src/components/LoginForm.tsx       # Login form component
  src/middleware.ts                  # Route protection middleware
  prisma/seed.ts                     # Admin user seed

Modificados:
  prisma/schema.prisma               # + model User
  package.json                       # + next-auth, bcryptjs
  .env                               # + AUTH_SECRET
  src/app/providers.tsx              # + SessionProvider
  src/app/api/dashboard/**/route.ts  # + withAuth
  src/app/api/territorio/**/route.ts # + withAuth
  src/app/api/demandas/**/route.ts   # + withAuth + filtro agente
  src/app/api/crm/**/route.ts        # + withAuth + filtro agente
  src/app/api/relatorios/**/route.ts # + withAuth + filtro agente
```

---

### Task 1: Prisma User model + migration + seed

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json`
- Create: migration (auto)

- [ ] **Step 1: Add User model to schema**

Add after model `Visita` in `/var/www/html/mapeamento/prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  nome      String
  email     String   @unique
  senhaHash String
  role      String   @default("agente")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
cd /var/www/html/mapeamento && npx prisma migrate dev --name add_user_model
```

Expected: Migration created and applied. New `User` table in database.

- [ ] **Step 3: Create seed script**

Write to `/var/www/html/mapeamento/prisma/seed.ts`:

```ts
import { PrismaClient } from "../src/generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@cassol.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@cassol.com",
      senhaHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    },
  });
  console.log("Admin criado:", admin.email);

  const agente = await prisma.user.upsert({
    where: { email: "agente@cassol.com" },
    update: {},
    create: {
      nome: "Agente Teste",
      email: "agente@cassol.com",
      senhaHash: await bcrypt.hash("agente123", 10),
      role: "agente",
    },
  });
  console.log("Agente criado:", agente.email);
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

- [ ] **Step 4: Add seed config to package.json**

Read `/var/www/html/mapeamento/package.json` and add after the `"scripts"` section:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 5: Run seed**

```bash
cd /var/www/html/mapeamento && npx prisma db seed
```

Expected: "Admin criado: admin@cassol.com" and "Agente criado: agente@cassol.com"

- [ ] **Step 6: Verify model compiles**

```bash
cd /var/www/html/mapeamento && npx prisma generate && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add User model, migration, and seed"
```

---

### Task 2: Install dependencies + Auth.js config + types + catch-all route

**Files:**
- Modify: `package.json` (add next-auth, bcryptjs, @types/bcryptjs)
- Create: `src/lib/auth.ts`
- Create: `src/types/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /var/www/html/mapeamento && npm install next-auth@beta bcryptjs && npm install -D @types/bcryptjs
```

- [ ] **Step 2: Create auth types**

Write to `/var/www/html/mapeamento/src/types/auth.ts`:

```ts
import { DefaultSession, DefaultUser } from "next-auth";

export type UserRole = "admin" | "agente";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User extends SessionUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    nome: string;
  }
}
```

- [ ] **Step 3: Create auth config**

Write to `/var/www/html/mapeamento/src/lib/auth.ts`:

```ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.senhaHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role as "admin" | "agente",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.nome = user.nome;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "admin" | "agente";
        session.user.nome = token.nome!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
};
```

- [ ] **Step 4: Create Auth.js catch-all route**

Write to `/var/www/html/mapeamento/src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 5: Add AUTH_SECRET to .env**

Read `/var/www/html/mapeamento/.env` and append:

```bash
AUTH_SECRET="cassol-mapeamento-secret-dev-change-in-production"
```

- [ ] **Step 6: Verify**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add Auth.js config, types, and catch-all route"
```

---

### Task 3: SessionProvider in root layout

**Files:**
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Add SessionProvider**

Read `/var/www/html/mapeamento/src/app/providers.tsx` and modify to:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
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
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add SessionProvider to root layout"
```

---

### Task 4: Login page + LoginForm component

**Files:**
- Create: `src/components/LoginForm.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /var/www/html/mapeamento/src/app/login
```

- [ ] **Step 2: Write LoginForm**

Write to `/var/www/html/mapeamento/src/components/LoginForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
      >
        <LogIn className="w-4 h-4" />
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Write Login page**

Write to `/var/www/html/mapeamento/src/app/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/LoginForm";
import { BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-600" />
          <h1 className="text-xl font-bold">Cassol Mapeamento</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Faça login para acessar o sistema
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add login page and LoginForm component"
```

---

### Task 5: Middleware for route protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware**

Write to `/var/www/html/mapeamento/src/middleware.ts`:

```ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Verify**

The middleware uses `next-auth/middleware` which handles redirect to `/login` automatically. Run:

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add middleware for route protection"
```

---

### Task 6: API protection helper + apply to all API routes

**Files:**
- Modify: `src/lib/auth.ts` (add withAuth helper)
- Modify: All 21 API route files under `src/app/api/`

- [ ] **Step 1: Add withAuth helper to auth.ts**

Read `/var/www/html/mapeamento/src/lib/auth.ts` and add this import and function at the top (after the existing imports) and export (at the bottom):

Add import:
```ts
import { NextResponse } from "next/server";
```

Add at the bottom of the file, before the export (or just add as additional export):

```ts
import { getServerSession } from "next-auth";

export async function withAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }
  return session;
}
```

- [ ] **Step 2: Apply withAuth to all API routes**

For each API route file under `src/app/api/`, add the import and guard. The pattern:

Import (add at top):
```ts
import { withAuth } from "@/lib/auth";
```

Guard (add right after `export async function GET` / `POST` etc, before any logic):

```ts
export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  // existing logic follows...
}
```

**Files to modify (all API route files):**

Dashboard routes (5 files):
- `src/app/api/dashboard/kpis/route.ts`
- `src/app/api/dashboard/graficos/route.ts`
- `src/app/api/dashboard/ranking/route.ts`
- `src/app/api/dashboard/timeline/route.ts`
- `src/app/api/dashboard/mapa/route.ts`
- `src/app/api/dashboard/alertas/route.ts`

Território routes (7 files):
- `src/app/api/territorio/estados/route.ts`
- `src/app/api/territorio/municipios/route.ts`
- `src/app/api/territorio/bairros/route.ts`
- `src/app/api/territorio/setores/route.ts`
- `src/app/api/territorio/ruas/route.ts`
- `src/app/api/territorio/comunidades/route.ts`
- `src/app/api/territorio/regioes/route.ts`

Demandas routes (3 files):
- `src/app/api/demandas/route.ts`
- `src/app/api/demandas/[id]/route.ts`
- `src/app/api/demandas/[id]/status/route.ts`

CRM routes (3 files):
- `src/app/api/crm/contatos/route.ts`
- `src/app/api/crm/contatos/[id]/route.ts`
- `src/app/api/crm/interacoes/route.ts`

Relatórios routes (2 files):
- `src/app/api/relatorios/pre-definidos/route.ts`
- `src/app/api/relatorios/customizado/route.ts`

**Important:** For routes that use `NextResponse` already, add `import { NextResponse } from "next/server"` at top. For routes that use `NextRequest`, add `import { NextRequest, NextResponse } from "next/server"`.

- [ ] **Step 3: Verify**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: protect all API routes with withAuth helper"
```

---

### Task 7: Agent data filtering on API routes

**Files:**
- Modify: API routes that return data scoped to `responsavel`

- [ ] **Step 1: Filter demandas routes for agents**

For `src/app/api/demandas/route.ts`, after the `withAuth` guard and before constructing Prisma queries, add:

```ts
import type { Session } from "next-auth";

export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  // ... existing param parsing ...

  const where: Record<string, unknown> = {};
  // ... existing filter building ...

  if (session.user.role === "agente") {
    where.responsavel = session.user.nome;
  }

  // ... rest of existing logic using `where` ...
}
```

For `src/app/api/demandas/[id]/route.ts`, read the demanda first and check if the agent owns it for PUT/DELETE:

```ts
if (session.user.role === "agente") {
  const demanda = await prisma.demanda.findUnique({ where: { id } });
  if (!demanda || demanda.responsavel !== session.user.nome) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
}
```

For `src/app/api/demandas/[id]/status/route.ts`, same ownership check.

- [ ] **Step 2: Filter CRM routes for agents**

For `src/app/api/crm/contatos/route.ts`, after the `withAuth` guard:

```ts
if (session.user.role === "agente") {
  where.responsavel = session.user.nome;
}
```

Note: The `Contato` model doesn't have a `responsavel` field directly. The agent filter should instead be: the user's name should match as the responsible person. However, looking at the existing models, `Contato` has no `responsavel` field. The agent should see contacts linked to their demands. For simplicity, in the first version, agents see all contacts (read-only territory data) but can only create/edit their own demands and interactions.

Actually, looking at the schema:
- `Demanda` has `responsavel`
- `Interacao` has `responsavel`
- `Contato` has no `responsavel`

So the filtering should be:
- **Demandas**: filter by `responsavel`
- **Interacoes**: filter by `responsavel` in the where clause
- **Contatos**: agents see all (contacts are directory entries, not task assignments)
- **Relatorios**: filter demandas/interações by `responsavel`

For CRM, modify `src/app/api/crm/interacoes/route.ts`:

```ts
if (session.user.role === "agente") {
  where.responsavel = session.user.nome;
}
```

- [ ] **Step 3: Filter relatorios routes for agents**

For `src/app/api/relatorios/pre-definidos/route.ts` and `src/app/api/relatorios/customizado/route.ts`:

After `withAuth` guard, if agent, add to all `where` date filters:
```ts
if (session.user.role === "agente") {
  if (Object.keys(whereDate).length) {
    whereDate.responsavel = session.user.nome;
  } else {
    whereDate = { responsavel: session.user.nome };
  }
}
```

And similarly for `whereInteracao`:
```ts
if (session.user.role === "agente") {
  whereInteracao.responsavel = session.user.nome;
}
```

- [ ] **Step 4: Verify**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "feat: add agent data filtering to API routes"
```

---

### Task 8: Build check + final verification

**Files:**
- No file changes — verification only.

- [ ] **Step 1: Full build**

```bash
cd /var/www/html/mapeamento && npx next build 2>&1 | tail -40
```

Expected: Build succeeds. All routes compile: `/`, `/crm`, `/demandas`, `/relatorios`, `/territorio`, `/login`.

- [ ] **Step 2: Verify middleware works**

```bash
cd /var/www/html/mapeamento && npx tsc --noEmit src/middleware.ts
```

Expected: No errors.

- [ ] **Step 3: Commit (if any fixes needed)**

```bash
cd /var/www/html/mapeamento && git add -A && git commit -m "fix: build fixes after auth implementation"
```

---

## Self-Review

**1. Spec coverage:**
- User model → Task 1
- Auth.js config with CredentialsProvider → Task 2
- SessionProvider → Task 3
- Login page → Task 4
- Middleware → Task 5
- API protection → Task 6
- Agent data filtering → Task 7
- Build verification → Task 8

**2. Placeholder scan:** No TBD, TODO, or incomplete code found. All steps have complete, runnable code.

**3. Type consistency:** `SessionUser` defined in types/auth.ts matches usage in auth.ts, middleware, and API routes. `UserRole` = `"admin" | "agente"` consistent everywhere.
