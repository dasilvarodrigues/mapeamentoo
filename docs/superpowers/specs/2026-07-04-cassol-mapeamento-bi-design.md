# BI / Relatórios — Mapeamento Cassol

## Visão Geral
Módulo de Business Intelligence com relatórios pré-definidos e customizáveis, combinando dados de todos os módulos (Dashboard, Território, Demandas, CRM, Visitas). Exportação para PDF via print otimizado do navegador.

## Rotas
- `/relatorios` — página principal do módulo

## Layout
Sidebar à esquerda com lista de relatórios + área de preview à direita. Filtros no topo do preview. Botão "Exportar PDF" no canto superior direito.

## Relatórios Pré-definidos (6)

### 1. Visão Geral
KPIs: total demandas, abertas, resolvidas, visitas, contatos. Gráfico de evolução mensal (linha) com demandas abertas vs resolvidas.

### 2. Demandas por Localidade
Gráfico de barras: demandas agrupadas por bairro. Tabela com nomes e contagens.

### 3. Demandas por Tipo
Gráfico de pizza/rosca: distribuição por tipo de demanda. Tabela com percentuais.

### 4. Ranking de Responsáveis
Gráfico de barras horizontais: responsáveis com mais demandas. Tabela com nome, total, resolvidas, pendentes.

### 5. Cobertura Territorial
Tabela hierárquica: região → bairros → comunidades. Indicador de cobertura (com/sem demanda).

### 6. Atividades CRM
Timeline de interações no período. Tabela de contatos ativos. Gráfico de interações por mês.

## Relatório Customizável
Usuário seleciona:
- Métricas (demandas, visitas, contatos, interações)
- Período (data início/fim)
- Filtros: região, bairro, tipo demanda, status, responsável
- Agrupamento: nenhum, bairro, tipo, responsável, mês

Preview atualiza em tempo real. Gera PDF com os mesmos dados.

## API

### GET /api/relatorios/pre-definidos
Query params: `tipo` (geral|localidade|tipo|responsaveis|cobertura|crm), `dataInicio`, `dataFim`

Retorna dados agregados conforme o tipo.

### GET /api/relatorios/customizado
Query params: `metricas[]`, `dataInicio`, `dataFim`, `regiaoId`, `bairroId`, `tipo`, `status`, `responsavel`, `agruparPor`

Retorna dados conforme filtros do usuário.

## Componentes

### SidebarRelatorios
Lista clicável dos 6 pré-definidos + entrada "Customizado". Destaque no item ativo.

### PreDefinidoCard
Card com ícone, título e descrição curta. Usado se futuramente houver grid de seleção.

### RelatorioCustomizado
Formulário com selects múltiplos, date picker, checkboxes. Preview embutido.

### RelatorioPreview
Container que recebe o tipo de relatório e dados, renderiza gráficos + tabelas.

### FiltrosRelatorio
Barra de filtros: período (date range), região (select), bairro (select dependente), tipo, status, responsável.

### ExportarPDF
Botão que chama `window.print()`. Visível apenas na tela (oculto no print).

### RelatorioPrint
Versão do relatório otimizada para impressão: sem sidebar, sem botões, largura total, fontes serifadas, quebras de página.

### Gráficos (reutilizáveis)
- GraficoBarra — Recharts BarChart
- GraficoPizza — Recharts PieChart
- GraficoLinha — Recharts LineChart
- TabelaRelatorio — tabela estilizada com formatação de números

## Dados
Consultas Prisma com aggregation raw:
- `COUNT`, `GROUP BY`, `date_trunc` para agregação temporal
- Joins entre Demanda ↔ Bairro ↔ Região para relatórios territorial
- Joins entre Contato ↔ Interacao para relatórios CRM

## CSS @media print
- Oculta: sidebar, botões, filtros, header/footer do site
- Gráficos ocupam largura total da página
- Tabelas com `page-break-inside: avoid`
- Quebras de página entre seções (`page-break-after: always`)
- Cores escuras convertidas para preto sólido
- Fonte serifada (Georgia ou similar) para corpo do relatório

## Estrutura de Arquivos
```
src/app/relatorios/page.tsx
src/components/relatorios/
  SidebarRelatorios.tsx
  PreDefinidoCard.tsx
  RelatorioCustomizado.tsx
  RelatorioPreview.tsx
  FiltrosRelatorio.tsx
  ExportarPDF.tsx
  RelatorioPrint.tsx
  GraficoBarra.tsx
  GraficoPizza.tsx
  GraficoLinha.tsx
  TabelaRelatorio.tsx
src/app/api/relatorios/
  pre-definidos/route.ts
  customizado/route.ts
src/types/relatorios.ts
```
