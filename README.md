# Cassol Mapeamento Regional

SaaS de mapeamento regional com dashboard executivo georreferenciado.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, ShadCN UI |
| Mapas | Leaflet, react-leaflet, leaflet.heat |
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
│   └── api/dashboard/
│       ├── kpis/route.ts           # Indicadores agregados
│       ├── mapa/route.ts           # GeoJSON pontos
│       ├── graficos/route.ts       # Série temporal + categorias
│       ├── ranking/route.ts        # Regiões ordenadas
│       ├── timeline/route.ts       # Atividades recentes
│       └── alertas/route.ts        # SSE stream
├── components/dashboard/
│   ├── CardKPI.tsx                 # Cartão com contagem animada
│   ├── MapaInterativo.tsx          # Wrapper dinâmico (SSR-safe)
│   ├── MapaLeaflet.tsx             # Mapa Leaflet real
│   ├── MapaCalor.tsx               # Wrapper heatmap
│   ├── MapaCalorLeaflet.tsx        # Heatmap Leaflet real
│   ├── GraficoCrescimento.tsx      # Gráfico de linhas
│   ├── RankingRegional.tsx         # Tabela rankeada
│   ├── Timeline.tsx                # Linha do tempo
│   └── PainelAlertas.tsx           # Alertas SSE
├── lib/
│   ├── prisma.ts                   # Prisma client config
│   └── utils.ts                    # cn(), formatDate(), formatDateTime()
└── types/
    └── dashboard.ts                # Interfaces TypeScript
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

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/kpis` | Total de regiões, bairros, comunidades, demandas, visitas |
| GET | `/api/dashboard/mapa` | GeoJSON FeatureCollection (pontos) |
| GET | `/api/dashboard/graficos` | { meses, categorias } |
| GET | `/api/dashboard/ranking` | Regiões ordenadas por total de demandas |
| GET | `/api/dashboard/timeline` | Últimas 15 atividades |
| GET | `/api/dashboard/alertas` | SSE — eventos a cada 15s |

## Banco de Dados

```prisma
Regiao    → Bairro[]  → Comunidade[]
Regiao    → Demanda[]
Regiao    → Visita[]
Bairro    → Demanda[]
Demanda   → (categoria, status, prioridade, lat/lng)
```

## Seed Data

- 6 regiões (Zona Norte, Sul, Leste, Oeste, Centro, Rural)
- 18 bairros (3 por região)
- 36 comunidades
- 204 demandas (6 categorias, 3 status)
- 120 visitas (últimos 6 meses)

## Módulo Atual

**Dashboard Executivo** — primeira entrega do ecossistema. Próximos módulos: Cadastro Territorial, Gestão de Demandas, CRM, BI, IA, App Mobile.
