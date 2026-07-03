# Cassol Mapeamento Regional — Dashboard Executivo

## Visão Geral

SaaS de mapeamento regional com dashboard executivo georreferenciado, desenvolvido para a Cassol Softwares. Esta spec cobre exclusivamente o módulo **Dashboard Executivo** — primeira entrega do ecossistema Cassol Mapeamento Regional.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| Mapas | Leaflet, react-leaflet, leaflet.heat |
| Gráficos | Recharts |
| Data Fetching | TanStack React Query |
| Animações | Framer Motion |
| Banco | PostgreSQL + PostGIS via Prisma ORM |
| Tempo Real | Server-Sent Events (SSE) |
| Ícones | Lucide React |

## Arquitetura

```
/var/www/html/mapeamento/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Dashboard (rota raiz)
│   │   ├── loading.tsx
│   │   ├── layout.tsx              # Layout global com provider
│   │   └── api/
│   │       └── dashboard/
│   │           ├── kpis/route.ts
│   │           ├── mapa/route.ts
│   │           ├── graficos/route.ts
│   │           ├── ranking/route.ts
│   │           ├── timeline/route.ts
│   │           └── alertas/route.ts  # SSE stream
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── CardKPI.tsx
│   │   │   ├── MapaInterativo.tsx
│   │   │   ├── MapaCalor.tsx
│   │   │   ├── GraficoCrescimento.tsx
│   │   │   ├── RankingRegional.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── PainelAlertas.tsx
│   │   └── ui/           # ShadCN
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── utils.ts
│   └── types/
│       └── dashboard.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts            # Dados mockados
```

## Modelo de Dados

### Regiao
- id, nome, municipio, uf, geometria (PostGIS MultiPolygon), createdAt, updatedAt

### Bairro
- id, nome, regiaoId (FK), geometria (PostGIS MultiPolygon), createdAt

### Comunidade
- id, nome, bairroId (FK), localizacao (PostGIS Point), createdAt

### Demanda
- id, categoria, descricao, status (aberta/em_andamento/resolvida), prioridade, localizacao (PostGIS Point), regiaoId (FK), bairroId (FK), createdAt, updatedAt, resolvedAt

### Visita
- id, titulo, regiaoId (FK), data, createdAt

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/dashboard/kpis | Indicadores agregados |
| GET | /api/dashboard/mapa | GeoJSON regiões + pontos |
| GET | /api/dashboard/graficos | Série crescimento + categorias |
| GET | /api/dashboard/ranking | Regiões ordenadas por total |
| GET | /api/dashboard/timeline | Atividades recentes |
| GET | /api/dashboard/alertas | SSE stream de eventos |

## Componentes Visuais

### DashboardLayout
Grid responsivo com 4 colunas (desktop), 2 (tablet), 1 (mobile). Toggle dark mode. Header com badge de alertas.

### CardKPI
Glassmorphism, gradiente, ícone Lucide. Animação de contagem com Framer Motion (useMotionValue + spring).

### MapaInterativo
Leaflet + react-leaflet. Camada base OpenStreetMap. Polígonos GeoJSON das regiões com cores por densidade. Popup ao clique com nome e total de demandas.

### MapaCalor
Sobreposição heatmap usando leaflet.heat. Pontos gerados a partir das coordenadas das demandas. Opacidade e raio ajustáveis.

### GraficoCrescimento
Recharts LineChart. Eixo X: meses (6). Eixo Y: total de demandas. Tooltip, grid, animação de entrada. Segunda série para resolvidas.

### RankingRegional
Tabela com posição, nome da região, total demandas, abertas, resolvidas. Barra de progresso proporcional ao líder.

### Timeline
Lista vertical com ícone, descrição e timestamp. Scroll infinito com paginação.

### PainelAlertas
SSE stream. Card animado para cada evento. Badge no header com contagem não lida.

## Dados Mockados (Seed)

- 6 regiões (Zona Norte, Sul, Leste, Oeste, Centro, Rural)
- 18 bairros (3 por região)
- 36 comunidades
- 200 demandas distribuídas em 6 categorias (iluminação, pavimentação, saúde, educação, segurança, saneamento)
- 120 visitas nos últimos 6 meses
- Coordenadas geográficas simuladas dentro de polígonos reais (aproximação de área urbana)

## Tempo Real

Conexão SSE em /api/dashboard/alertas. Eventos simulados a cada 15s: nova demanda criada, status alterado, visita registrada. Fallback para polling 15s se SSE falhar.

## Identidade Visual

- Glassmorphism em cards e painéis
- Gradientes nos backgrounds (brand-600 a brand-800)
- Dark mode completo com variáveis CSS
- Animações suaves (framer-motion, fade-in, slide-up)
- Ícones Lucide consistentes
- Fonte Inter (sans-serif)

## Próximos Passos (fora desta spec)

- Cadastro Territorial (GIS avançado com upload Shapefile/KML/GeoJSON)
- Cadastro de Lideranças com LGPD
- Gestão de Demandas com mídia
- CRM e Agenda
- Pesquisas Offline
- BI Avançado (Power BI style)
- IA Assistente (RAG)
- App Mobile .NET MAUI
- Controle de Acesso RBAC
