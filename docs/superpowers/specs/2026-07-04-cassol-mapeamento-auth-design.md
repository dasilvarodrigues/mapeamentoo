# Autenticação e Autorização — Design

> **Sistema:** Cassol Mapeamento Regional
> **Módulo:** Autenticação e Controle de Acesso
> **Data:** 2026-07-04
> **Status:** Aprovado

## 1. Visão Geral

Implementar autenticação via email+senha com Auth.js v5, dois níveis de acesso (admin, agente), proteção total de rotas (páginas e API), e filtragem de dados por responsabilidade do agente.

## 2. Stack

- **Auth library:** Auth.js v5 (`next-auth` v5)
- **Provedor:** CredentialsProvider (email + senha)
- **Sessão:** JWT strategy (única compatível com CredentialsProvider)
- **Hash de senha:** bcryptjs
- **ORM:** Prisma 7 (modelo User)
- **Middleware:** Next.js `src/middleware.ts`

## 3. Modelo de Dados

### User (Prisma)

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

- `role`: `"admin"` | `"agente"`
- Senha armazenada como hash bcrypt (nunca em texto plano)
- Seed inicial: criar usuário admin padrão

## 4. Fluxo de Autenticação

### 4.1 Login

1. Usuário acessa `/login`
2. Preenche email + senha
3. POST para `/api/auth/callback/credentials` (Auth.js gerencia)
4. Auth.js `authorize` function:
   - Busca User por email no Prisma
   - Compara senha com bcrypt
   - Retorna objeto `{ id, nome, email, role }` ou `null`
5. Se válido: Auth.js cria JWT e seta cookie `next-auth.session-token`
6. Redireciona para `/dashboard`

### 4.2 Sessão

- JWT contém: `sub` (id), `nome`, `email`, `role`
- Callback `jwt()`: adiciona `nome` e `role` ao token
- Callback `session()`: expõe `nome` e `role` no objeto session
- `maxAge`: 30 dias (configurável via env `NEXTAUTH_SECRET`)

### 4.3 Logout

- Botão no header/layout → `signOut()` do Auth.js
- Limpa cookie JWT
- Redireciona para `/login`

## 5. Proteção de Rotas

### 5.1 Middleware (`src/middleware.ts`)

```
Matcher: /(?!api/auth|login|_next/static|_next/image|favicon.ico).*
```

- Lê session via `getToken()` (Auth.js helper para middleware)
- Se não autenticado → redireciona para `/login`
- Se autenticado → `NextResponse.next()`
- Rota `/login`: se autenticado → redireciona para `/dashboard`

### 5.2 API Routes

Helper `withAuth`:

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function withAuth(
  requiredRole?: "admin" | "agente"
): Promise<Session | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 }) as NextResponse;
  if (requiredRole && session.user.role !== requiredRole) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 }) as NextResponse;
  }
  return session;
}
```

Uso em cada API route:

```ts
export async function GET(request: NextRequest) {
  const session = await withAuth();
  if (session instanceof NextResponse) return session;
  // ... lógica existente
}
```

### 5.3 Filtro por role do usuário

Quando `session.user.role === "agente"`, nas queries que listam demandas, contatos, interações, visitas, adicionar:

```ts
if (session.user.role === "agente") {
  where.responsavel = session.user.nome;
}
```

Isso garante que o agente vê apenas registros onde ele é o responsável. Admin não tem filtro (vê tudo).

**Onde aplicar o filtro:** Em todas as API routes dos módulos Dashboard, Território, Demandas, CRM, Relatórios que retornam dados do banco. Apenas rotas que retornam dados cadastrais (estados, municípios, bairros, etc.) não precisam de filtro — mas ainda precisam de autenticação.

## 6. Páginas

### 6.1 Login (`/login`)

- Formulário centralizado com card "glass"
- Campo email + campo senha + botão "Entrar"
- Estado de loading e erro
- Link para recuperação de senha (placeholder — implementação futura)
- Responsivo, mesma identidade visual do app

### 6.2 Header/Navbar com user info

- Adicionar ao layout principal: nome do usuário + role badge + botão "Sair"
- Usar session do Auth.js via `useSession()`

## 7. Arquivos

### Novos

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/auth.ts` | Configuração do Auth.js (authOptions) |
| `src/app/api/auth/[...nextauth]/route.ts` | Catch-all Auth.js handler |
| `src/app/login/page.tsx` | Página de login |
| `src/components/LoginForm.tsx` | Formulário de login |
| `src/middleware.ts` | Proteção de rotas |
| `src/types/auth.ts` | Tipos SessionUser |

### Modificados

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Adicionar model User |
| `package.json` | Adicionar next-auth, bcryptjs, @types/bcryptjs |
| `.env` | Adicionar AUTH_SECRET, AUTH_URL |
| `src/app/providers.tsx` | Adicionar SessionProvider |
| `src/app/api/dashboard/**/*.ts` | Adicionar withAuth + filtro agente |
| `src/app/api/territorio/**/*.ts` | Adicionar withAuth |
| `src/app/api/demandas/**/*.ts` | Adicionar withAuth + filtro agente |
| `src/app/api/crm/**/*.ts` | Adicionar withAuth + filtro agente |
| `src/app/api/relatorios/**/*.ts` | Adicionar withAuth + filtro agente |
| `src/app/(todas as pages)/page.tsx` | Adicionar useSession no topo (ou apenas confiar no middleware) |

## 8. Seed

Criar seed script para usuário admin inicial:

```ts
// prisma/seed.ts
import { PrismaClient } from "@/generated/client";
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
}

main();
```

## 9. Considerações de Segurança

- Senha mínima de 6 caracteres (validação client + server)
- bcrypt com 10 rounds de salt
- JWT assinado com `AUTH_SECRET` (variável de ambiente)
- Cookies HTTP-only, secure em produção
- Rate limiting implícito via Next.js (não implementar agora)
- Logout invalida o cookie (não revoga JWT — limitação do JWT strategy)
- Em produção, usar `AUTH_URL` apontando para domínio real
