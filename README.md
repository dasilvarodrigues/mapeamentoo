# Cassol Mapeamento Regional

SaaS de mapeamento regional com dashboard executivo, cadastro territorial georreferenciado, gestão de demandas, CRM comunitário e relatórios/BI.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, ShadCN UI |
| Mapas | Leaflet, react-leaflet, leaflet.heat, leaflet-draw |
| Gráficos | Recharts |
| Data Fetching | TanStack React Query |
| Animações | Framer Motion |
| Banco | PostgreSQL via Prisma 7 ORM |
| Autenticação | Auth.js v5 (CredentialsProvider, JWT) |
| Tempo Real | Server-Sent Events (SSE) |
| Ícones | Lucide React |

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/cassol_mapeamento"
AUTH_SECRET="<gerar com: openssl rand -base64 32>"
AUTH_URL="https://seudominio.com.br"
NEXT_PUBLIC_MAPBOX_TOKEN=""  # opcional
```

## Estrutura

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Layout global (inclui SessionProvider)
│   ├── providers.tsx               # React Query provider
│   ├── loading.tsx                 # Loading state
│   ├── login/
│   │   └── page.tsx                # Página de login
│   ├── territorio/
│   │   ├── page.tsx                # Cadastro Territorial
│   │   └── layout.tsx              # Metadata
│   ├── demandas/
│   │   ├── page.tsx                # Gestão de Demandas
│   │   └── layout.tsx              # Metadata
│   ├── crm/
│   │   ├── page.tsx                # CRM Comunitário
│   │   └── layout.tsx              # Metadata
│   ├── relatorios/
│   │   ├── page.tsx                # Relatórios / BI
│   │   └── layout.tsx              # Metadata
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts        # Auth.js catch-all
│       │   ├── csrf/route.ts       # CSRF token (implícito)
│       │   └── callback/...        # Credentials callback (implícito)
│       ├── dashboard/
│       │   ├── kpis/route.ts       # Indicadores agregados
│       │   ├── mapa/route.ts       # GeoJSON pontos
│       │   ├── graficos/route.ts   # Série temporal + categorias
│       │   ├── ranking/route.ts    # Regiões ordenadas
│       │   ├── timeline/route.ts   # Atividades recentes
│       │   └── alertas/route.ts    # SSE stream
│       ├── territorio/
│       │   ├── estados/route.ts    # CRUD Estado
│       │   ├── municipios/route.ts # CRUD Municipio
│       │   ├── bairros/route.ts    # CRUD Bairro
│       │   ├── comunidades/route.ts# CRUD Comunidade
│       │   ├── setores/route.ts    # CRUD Setor
│       │   └── ruas/route.ts       # CRUD Rua
│       ├── demandas/
│       │   ├── route.ts            # GET (list) + POST (create)
│       │   ├── [id]/route.ts       # GET + PUT + DELETE
│       │   └── [id]/status/route.ts# PATCH (status)
│       ├── crm/
│       │   ├── contatos/route.ts   # GET (list) + POST (create)
│       │   ├── contatos/[id]/route.ts # GET + PUT + DELETE
│       │   └── interacoes/route.ts # GET (by contatoId) + POST
│       └── relatorios/
│           ├── pre-definidos/route.ts  # Relatórios pré-definidos
│           └── customizado/route.ts    # Relatório customizado
├── components/
│   ├── dashboard/
│   │   ├── CardKPI.tsx             # Cartão com contagem animada
│   │   ├── MapaInterativo.tsx      # Wrapper dinâmico (SSR-safe)
│   │   ├── MapaLeaflet.tsx         # Mapa Leaflet real
│   │   ├── MapaCalor.tsx           # Wrapper heatmap
│   │   ├── MapaCalorLeaflet.tsx    # Heatmap Leaflet real
│   │   ├── GraficoCrescimento.tsx  # Gráfico de linhas
│   │   ├── RankingRegional.tsx     # Tabela rankeada
│   │   ├── Timeline.tsx            # Linha do tempo
│   │   └── PainelAlertas.tsx       # Alertas SSE
│   ├── demandas/
│   │   ├── FiltrosDemandas.tsx      # Barra de filtros
│   │   ├── TabelaDemandas.tsx       # Tabela ordenável
│   │   ├── CardDemanda.tsx          # Card do kanban
│   │   ├── KanbanDemandas.tsx       # Quadro kanban com drag & drop
│   │   ├── FormularioDemanda.tsx    # Formulário criar/editar
│   │   └── ModalDemanda.tsx         # Modal de detalhes
│   ├── crm/
│   │   ├── ListaContatos.tsx       # Tabela com busca
│   │   ├── TimelineInteracoes.tsx  # Timeline vertical
│   │   ├── FormularioContato.tsx   # Form criar/editar contato
│   │   ├── FormularioInteracao.tsx # Form registrar interação
│   │   └── ModalContato.tsx        # Modal detalhes + timeline
│   ├── territorio/
│   │   ├── BreadcrumbTerritorio.tsx # Navegação hierárquica
│   │   ├── ArvoreHierarquica.tsx    # Árvore lateral
│   │   ├── FormularioLocalidade.tsx # Formulário dinâmico
│   │   ├── MapaTerritorial.tsx      # Wrapper SSR-safe
│   │   ├── MapaTerritorialLeaflet.tsx # Mapa + draw controls
│   │   └── ModalImportacao.tsx      # Upload GIS
│   └── relatorios/
│       ├── SidebarRelatorios.tsx    # Navegação entre tipos
│       ├── FiltrosRelatorio.tsx     # Filtros (data, região, etc)
│       ├── RelatorioPreview.tsx     # Preview do relatório
│       ├── RelatorioCustomizado.tsx # Construtor customizado
│       ├── RelatorioPrint.tsx       # Versão para impressão
│       ├── GraficoBarra.tsx         # Gráfico de barras (Recharts)
│       ├── GraficoLinha.tsx         # Gráfico de linhas (Recharts)
│       ├── GraficoPizza.tsx         # Gráfico de pizza (Recharts)
│       ├── TabelaRelatorio.tsx      # Tabela de dados
│       └── ExportarPDF.tsx          # Exportação via window.print()
├── lib/
│   ├── prisma.ts                   # Prisma client config
│   ├── auth.ts                     # Auth.js config + withAuth helper
│   └── utils.ts                    # cn(), formatDate(), formatDateTime()
├── middleware.ts                   # Proteção de rotas por cookie de sessão
└── types/
    ├── dashboard.ts                # Interfaces do dashboard
    ├── territorio.ts               # Interfaces do cadastro territorial
    └── relatorios.ts               # Interfaces de relatórios/BI
```

## Autenticação

O sistema usa **Auth.js v5** com **CredentialsProvider** (email + senha) e estratégia **JWT**.

### Roles

| Role | Acesso |
|------|--------|
| `admin` | Acesso total — todas as rotas, CRUD completo, relatórios sem restrição |
| `agente` | Acesso limitado — vê apenas demandas onde é responsável, filtro automático nas API routes |

### Fluxo

1. Usuário acessa rota protegida → middleware redireciona para `/login`
2. Login via `signIn("credentials", { email, password })` → valida contra hash bcrypt no banco
3. Sessão armazenada em cookie `__Secure-authjs.session-token` (JWT encryptado)
4. Middleware verifica cookie nas requisições seguintes
5. API routes usam `withAuth()` para proteger endpoints e filtrar por role

### Usuários padrão (seed)

| Email | Senha | Role |
|-------|-------|------|
| admin@cassol.com | admin123 | admin |
| agente@cassol.com | agente123 | agente |

### Criar novo usuário

```bash
npx prisma db seed  # apenas se quiser recriar os seeds padrão
```

Ou insira manualmente no banco com senha bcrypt:
```sql
INSERT INTO "User" (id, nome, email, "senhaHash", role)
VALUES (gen_random_uuid(), 'Nome', 'email@exemplo.com',
  -- hash via: node -e "require('bcryptjs').hash('senha123',10).then(console.log)"
  '$2a$10$...', 'agente');
```

### Rotas públicas vs protegidas

| Rota | Protegida | Descrição |
|------|-----------|-----------|
| `/login` | Não | Página de login |
| `/api/auth/*` | Não | Endpoints do Auth.js (CSRF, callback, session) |
| `/` | Sim | Dashboard |
| `/territorio/*` | Sim | Cadastro territorial |
| `/demandas/*` | Sim | Gestão de demandas |
| `/crm/*` | Sim | CRM comunitário |
| `/relatorios/*` | Sim | Relatórios/BI |
| Demais API routes | Sim | Todas usam `withAuth()` |

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ com banco `cassol_mapeamento` criado
- Usuário `cassol` com senha `cassol123` e permissão no banco

## Setup

```bash
# Instalar dependências
npm install

# Gerar Prisma client e aplicar migrations
npx prisma migrate dev

# Popular com dados mockados
npx prisma db seed

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção
npm start
```

## API Endpoints

### Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/kpis` | Total de regiões, bairros, comunidades, demandas, visitas |
| GET | `/api/dashboard/mapa` | GeoJSON FeatureCollection (pontos) |
| GET | `/api/dashboard/graficos` | { meses, categorias } |
| GET | `/api/dashboard/ranking` | Regiões ordenadas por total de demandas |
| GET | `/api/dashboard/timeline` | Últimas 15 atividades |
| GET | `/api/dashboard/alertas` | SSE — eventos a cada 15s |

### Cadastro Territorial

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/territorio/estados` | Listar estados |
| GET | `/api/territorio/municipios?estadoId=` | Listar municípios por estado |
| GET | `/api/territorio/bairros?municipioId=` | Listar bairros por município |
| GET | `/api/territorio/comunidades?bairroId=` | Listar comunidades por bairro |
| GET | `/api/territorio/setores?bairroId=` | Listar setores por bairro |
| GET | `/api/territorio/ruas?bairroId=` | Listar ruas por bairro |

### Gestão de Demandas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/demandas?page=&status=&categoria=&regiaoId=&busca=` | Lista paginada com filtros |
| GET | `/api/demandas/[id]` | Detalhe de demanda |
| POST | `/api/demandas` | Criar demanda |
| PUT | `/api/demandas/[id]` | Atualizar demanda |
| PATCH | `/api/demandas/[id]/status` | Atualizar status (drag & drop) |
| DELETE | `/api/demandas/[id]` | Excluir demanda |

### CRM Comunitário

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/crm/contatos?busca=&bairroId=` | Listar contatos |
| GET | `/api/crm/contatos/[id]` | Detalhe com interações |
| POST | `/api/crm/contatos` | Criar contato |
| PUT | `/api/crm/contatos/[id]` | Atualizar contato |
| DELETE | `/api/crm/contatos/[id]` | Excluir contato |
| GET | `/api/crm/interacoes?contatoId=` | Listar interações |
| POST | `/api/crm/interacoes` | Criar interação |

### Relatórios / BI

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/relatorios/pre-definidos?tipo=&dataInicio=&dataFim=` | Relatórios pré-definidos (geral, localidade, tipo, responsaveis, cobertura, crm) |
| GET | `/api/relatorios/customizado?metricas[]=&dataInicio=&dataFim=&regiaoId=&bairroId=&tipo=&status=&agruparPor=` | Relatório customizado com métricas selecionáveis |

#### Tipos de relatório pré-definido

| Tipo | Descrição |
|------|-----------|
| `geral` | KPIs gerais + evolução mensal de demandas |
| `localidade` | Demandas agrupadas por bairro |
| `tipo` | Distribuição por tipo de demanda |
| `responsaveis` | Ranking de responsáveis (total, resolvidas, pendentes) |
| `cobertura` | Cobertura por região (bairros, demandas, comunidades) |
| `crm` | Interações do CRM, contatos ativos, interações por mês |

#### Relatório customizado

- **Métricas**: demandas, visitas, contatos, interações
- **Agrupamento**: bairro, tipo, responsável, mês, nenhum
- **Filtros**: data (início/fim), região, bairro, tipo, status, responsável

## Banco de Dados

### Modelos do Dashboard

```
Regiao    → Bairro[]  → Comunidade[]
Regiao    → Demanda[]
Regiao    → Visita[]
Bairro    → Demanda[]
Demanda   → (categoria, status, prioridade, lat/lng)
```

### Modelos do Cadastro Territorial

```
Estado    → Municipio[]
Municipio → Bairro[]
Regiao    → Bairro[]
Bairro    → Setor[], Rua[], Comunidade[], Demanda[]
```

### Modelos da Gestão de Demandas

```
Demanda → (categoria, tipo, status, prioridade, responsavel, regiaoId, bairroId)
```

### Modelos do CRM

```
Contato → Interacao[]
Contato → Bairro?, Comunidade?
Interacao → Contato, Demanda?
```

### Modelo de Usuário (Auth)

```
User → (nome, email, senhaHash, role: "admin" | "agente")
```

## Seed Data

- 7 estados (SP, RJ, MG, PR, RS, BA, DF)
- 8 municípios (São Paulo, Guarulhos, Campinas, etc.)
- 6 regiões (Zona Norte, Sul, Leste, Oeste, Centro, Rural)
- 18 bairros (3 por região)
- 36 comunidades
- 204 demandas (6 categorias, 3 status)
- 120 visitas (últimos 6 meses)

## Módulos Implementados

- **Dashboard Executivo** — KPIs, mapa interativo, heatmap, gráficos, ranking, timeline, alertas em tempo real via SSE
- **Cadastro Territorial** — Hierarquia Estado → Rua com árvore lateral, breadcrumb, formulário dinâmico, mapa com ferramentas de desenho (leaflet-draw), importação GIS (GeoJSON/KML)
- **Gestão de Demandas** — CRUD completo com tabela filtrável, kanban com drag & drop (@hello-pangea/dnd), modais de criação/edição/detalhes, barra de filtros (status/categoria/busca)
- **CRM Comunitário** — Cadastro de contatos (nome, telefone, email, cargo, redes sociais, vínculo territorial), timeline de interações (visita/ligação/reunião/mensagem), modal de detalhes com timeline + formulários de criação/edição
- **BI/Relatórios** — 6 relatórios pré-definidos (geral, localidade, tipo, responsaveis, cobertura, crm), relatório customizado com métricas e agrupamentos, gráficos Recharts, exportação PDF via `window.print()`
- **Autenticação e Autorização** — Login email+senha com Auth.js v5, JWT, duas roles (admin/agente), proteção de rotas via middleware, API guard com `withAuth()`, filtro automático de dados por role do usuário
