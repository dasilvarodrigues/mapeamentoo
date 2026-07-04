# Cassol Mapeamento Regional

SaaS de mapeamento regional com dashboard executivo e cadastro territorial georreferenciados.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, ShadCN UI |
| Mapas | Leaflet, react-leaflet, leaflet.heat, leaflet-draw |
| Gráficos | Recharts |
| Data Fetching | TanStack React Query |
| Animações | Framer Motion |
| Banco | PostgreSQL via Prisma 7 ORM |
| Tempo Real | Server-Sent Events (SSE) |
| Ícones | Lucide React |

## Estrutura

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Layout global
│   ├── providers.tsx               # React Query provider
│   ├── loading.tsx                 # Loading state
│   ├── territorio/
│   │   ├── page.tsx                # Cadastro Territorial
│   │   └── layout.tsx              # Metadata
│   ├── demandas/
│   │   ├── page.tsx                # Gestão de Demandas
│   │   └── layout.tsx              # Metadata
│   ├── crm/
│   │   ├── page.tsx                # CRM Comunitário
│   │   └── layout.tsx              # Metadata
│   └── api/
│       ├── dashboard/
│       │   ├── kpis/route.ts       # Indicadores agregados
│       │   ├── mapa/route.ts       # GeoJSON pontos
│       │   ├── graficos/route.ts   # Série temporal + categorias
│       │   ├── ranking/route.ts    # Regiões ordenadas
│       │   ├── timeline/route.ts   # Atividades recentes
│       │   └── alertas/route.ts    # SSE stream
│       └── territorio/
│           ├── estados/route.ts    # CRUD Estado
│           ├── municipios/route.ts # CRUD Municipio
│           ├── bairros/route.ts    # CRUD Bairro
│           ├── comunidades/route.ts# CRUD Comunidade
│           ├── setores/route.ts    # CRUD Setor
│           └── ruas/route.ts       # CRUD Rua
│       ├── demandas/
│       │   ├── route.ts            # GET (list) + POST (create)
│       │   ├── [id]/route.ts       # GET + PUT + DELETE
│       │   └── [id]/status/route.ts# PATCH (status)
│       └── crm/
│           ├── contatos/route.ts   # GET (list) + POST (create)
│           ├── contatos/[id]/route.ts # GET + PUT + DELETE
│           └── interacoes/route.ts # GET (by contatoId) + POST
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
│   └── territorio/
│       ├── BreadcrumbTerritorio.tsx # Navegação hierárquica
│       ├── ArvoreHierarquica.tsx    # Árvore lateral
│       ├── FormularioLocalidade.tsx # Formulário dinâmico
│       ├── MapaTerritorial.tsx      # Wrapper SSR-safe
│       ├── MapaTerritorialLeaflet.tsx # Mapa + draw controls
│       └── ModalImportacao.tsx      # Upload GIS
├── lib/
│   ├── prisma.ts                   # Prisma client config
│   └── utils.ts                    # cn(), formatDate(), formatDateTime()
└── types/
    ├── dashboard.ts                # Interfaces do dashboard
    └── territorio.ts               # Interfaces do cadastro territorial
```

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
