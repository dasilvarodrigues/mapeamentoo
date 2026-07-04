# Gestão de Demandas — Design

## 1. Visão Geral

Módulo de CRUD completo para demandas, com listagem em tabela filtrável e visualização kanban para acompanhamento de fluxo de trabalho. Tudo centralizado em uma única página (`/demandas`) com modal para criar/editar.

## 2. Schema

Campos adicionados ao modelo `Demanda` existente:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `responsavel` | `String?` | Nome do responsável |
| `tipo` | `String` | Subtipo da demanda (ex: "emergencial", "rotina", "projeto") |

Os demais campos já existem: `id`, `categoria`, `descricao`, `status`, `prioridade`, `latitude`, `longitude`, `regiaoId`, `bairroId`, `responsavel`, `createdAt`, `updatedAt`, `resolvedAt`.

Status válidos: `aberta`, `em_andamento`, `resolvida`.

## 3. Páginas

Única página `/demandas` com tudo inline via modais:
- **Tabela** com ordenação por coluna e paginação
- **Toggle** para alternar para kanban
- **Modal** para criar/editar demanda
- **Modal** para detalhes da demanda

## 4. API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/demandas` | Lista paginada com `?status=&categoria=&regiaoId=&busca=&page=&limit=` |
| GET | `/api/demandas/[id]` | Detalhe de uma demanda |
| POST | `/api/demandas` | Criar demanda |
| PUT | `/api/demandas/[id]` | Atualizar demanda |
| PATCH | `/api/demandas/[id]/status` | Atualizar apenas status (drag & drop kanban) |
| DELETE | `/api/demandas/[id]` | Excluir demanda |

## 5. Componentes

```
src/components/demandas/
├── FiltrosDemandas.tsx    — Barra de filtros (status, categoria, região, busca)
├── TabelaDemandas.tsx     — Tabela ordenável com colunas
├── KanbanDemandas.tsx     — Quadro kanban com drag & drop
├── CardDemanda.tsx        — Card usado no kanban
├── FormularioDemanda.tsx  — Formulário criar/editar (modal)
├── ModalDemanda.tsx       — Modal de detalhes + ações
└── ModalDemandaWrapper.tsx — Dynamic import SSR-safe
```

### Layout kanban

- 3 colunas: Aberta | Em Andamento | Resolvida
- Cards com: descrição resumida, categoria, prioridade (ícone/bolinha), região
- Drag & drop entre colunas atualiza status via `PATCH /api/demandas/[id]/status`
- Ao dropar em "Resolvida", seta `resolvedAt = now()`

### Layout tabela

- Colunas: Prioridade, Descrição, Categoria, Região, Status, Responsável, Data
- Ordenável por qualquer coluna
- Paginação servidor-side
- Clique na linha → modal de detalhes

### Filtros

- Status: dropdown (todos, aberta, em_andamento, resolvida)
- Categoria: dropdown (todos, iluminação, pavimentação, saúde, educação, segurança, saneamento)
- Região: dropdown com lista de regiões
- Busca textual: filtra por descrição

## 6. Fluxo de Telas

```
/demandas
├── Modo tabela (padrão)
│   ├── Clicar linha → ModalDetalhe (ver, editar, excluir)
│   └── Botão "Nova" → Modal com FormularioDemanda (criar)
└── Modo kanban
    ├── Drag card entre colunas → atualiza status
    ├── Clicar card → ModalDetalhe
    └── Botão "Nova" → Modal com FormularioDemanda
```

## 7. Seed

Adicionar mais 100 demandas com os novos campos (`responsavel`, `tipo`) distribuídas entre as regiões existentes.

## 8. Próximos Passos (fora deste escopo)

- Exportar relatório (CSV/PDF)
- Anexar fotos/arquivos às demandas
- Histórico de alterações (audit log)
- Associação com visitas técnicas
