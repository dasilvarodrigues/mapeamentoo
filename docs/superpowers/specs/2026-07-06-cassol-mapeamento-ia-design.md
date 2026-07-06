# Cassol Mapeamento — Módulo de Inteligência Artificial (RAG + Chat)

## Resumo

Assistente inteligente com RAG sobre o banco de dados, capaz de responder perguntas sobre regiões, demandas, território, CRM e KPIs. Integrado como widget flutuante global no sistema.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| LLM Provider | Ollama (local) → fallback OpenAI (GPT-4o mini) |
| Embedding | Ollama `nomic-embed-text` → fallback OpenAI `text-embedding-3-small` |
| Vector Store | pgvector (extensão PostgreSQL) |
| Streaming | Server-Sent Events (SSE) |
| Frontend | React (ChatWidget, ChatDrawer, ChatMessage, ChatInput) |
| ORM | Prisma 7 |
| Auth | Auth.js v5 (mesma sessão do sistema) |

## Decisões de Arquitetura

| Decisão | Opção Escolhida | Alternativas Descartadas |
|---------|----------------|--------------------------|
| Abordagem RAG | Chunks pré-processados + pgvector | Text-to-SQL (risco SQL injection), LangChain Agent (overkill) |
| Provedor LLM | Ollama → OpenAI fallback | Só OpenAI (custo), só Ollama (instabilidade) |
| Integração | Widget flutuante global | Página dedicada (menos acessível) |
| Streaming | SSE | WebSocket (mais complexo), Polling (lento) |

## Modelo de Dados

### IaChunk

Chunks textuais vetorizados para busca semântica.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| conteudo | text | Texto do chunk em linguagem natural |
| metadata | jsonb | { tipo, regiao?, bairro?, periodo?, categoria? } |
| embedding | vector(384) | Embedding do `nomic-embed-text` (Ollama) |
| fonte | text | `kpi`, `demanda`, `territorio`, `crm` |
| criado_em | timestamptz | |
| atualizado_em | timestamptz | |

Índice: `CREATE INDEX ON "IaChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`

### IaConversa

Sessão de conversa do usuário com o assistente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| usuario_id | uuid FK → User | |
| titulo | text | Nome automático (ex: "Análise de demandas por região") |
| criado_em | timestamptz | |
| atualizado_em | timestamptz | |

### IaMensagem

Mensagens individuais dentro de uma conversa.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| conversa_id | uuid FK → IaConversa | |
| papel | enum: `user`, `assistant` | |
| conteudo | text | Texto da mensagem |
| chunks_fonte | jsonb[] | IDs dos chunks usados para gerar resposta (auditabilidade) |
| criado_em | timestamptz | |

## API Routes

### POST /api/ia/chat

Envia mensagem e recebe resposta via SSE streaming.

**Request:**
```json
{
  "conversaId": "uuid-opcional",  // null → cria nova conversa
  "mensagem": "Quais regiões têm mais demandas de iluminação?"
}
```

**Response (SSE):**
```
event: token
data: {"token": "A", "done": false}

event: token
data: {"token": " região", "done": false}

event: token
data: {"token": " Zona", "done": false}

...

event: token
data: {"token": "", "done": true, "conversaId": "uuid-da-conversa"}
```

**Fluxo interno:**
1. Salva mensagem do usuário no banco
2. Gera embedding via Ollama (`nomic-embed-text`). Se falhar, fallback OpenAI (`text-embedding-3-small`)
3. Busca top-5 chunks no pgvector (distância cosine < 0.5)
4. Monta prompt: system + chunks + histórico + pergunta
5. Chama LLM com streaming (Ollama → OpenAI fallback)
6. Faz stream dos tokens via SSE
7. Salva resposta completa ao final

### GET /api/ia/conversas

Lista conversas do usuário autenticado.

**Response:**
```json
{
  "data": [
    { "id": "uuid", "titulo": "Análise...", "ultimaMensagem": "...", "totalMensagens": 5, "criado_em": "..." }
  ]
}
```

### DELETE /api/ia/conversas/[id]

Exclui conversa e mensagens associadas.

### GET /api/ia/conversas/[id]/mensagens

Carrega histórico de mensagens de uma conversa.

### POST /api/ia/reindexar

Força reindexação completa dos chunks (admin apenas).

## Chat Widget (Frontend)

### Estrutura de Componentes

```
src/components/ia/
├── ChatWidget.tsx        # Botão flutuante + controle de abertura
├── ChatDrawer.tsx        # Drawer lateral com todo o conteúdo do chat
├── ChatMessage.tsx       # Bolha de mensagem (user/assistant)
├── ChatInput.tsx         # Textarea + botão enviar
├── ChatHistory.tsx       # Lista de conversas anteriores
└── ChatSkeleton.tsx      # Loading state animado
```

### Estados do ChatDrawer

| Estado | Condição | Renderização |
|--------|----------|-------------|
| Empty | Sem mensagens | Saudação + sugestões de perguntas ("Quais bairros têm mais demandas?", "Resumo executivo", "Tendências do mês") |
| Loading | Aguardando resposta | Mensagem do usuário + skeleton animado |
| Streaming | Recebendo tokens SSE | Texto aparecendo token por token com cursor piscante |
| Complete | Resposta finalizada | Mensagem completa + botões (copiar, nova pergunta) |
| Error | Falha na API/LLM | Mensagem de erro + "Tentar novamente" |
| History | Lista de conversas | Sidebar com conversas anteriores |

### Integração

O `ChatWidget` é posicionado como `fixed bottom-6 right-6 z-50` e incluído no layout raiz do dashboard (fora do AuthGuard para estar disponível em todas as páginas protegidas).

## Pipeline de Indexação (RAG)

### Estratégia de Chunking

| Tipo | Descrição | Conteúdo |
|------|-----------|----------|
| `kpi` | Resumo geral do sistema | Total regiões, bairros, comunidades, demandas, taxa de presença |
| `demanda` | Demanda por região/bairro | Agrupamento por tipo, status, prioridade |
| `territorio` | Hierarquia territorial | Estado → Município → Bairro, totais por nível |
| `crm` | Resumo CRM | Total contatos, interações por mês, top bairros |

### Triggers de Indexação

- **Manual:** Botão "Reindexar" no painel admin
- A indexação é assíncrona e pode levar alguns segundos

### Formato dos Chunks

Os chunks são textos em linguagem natural, não SQL bruto. Exemplo:

```
"Na região Zona Norte, bairro Jardim América, foram registradas 15 demandas
de iluminação no último ano. Destas, 8 estão pendentes, 5 resolvidas e 2
em andamento. A prioridade média é alta."
```

## Prompt Engineering

```
Você é um assistente especializado no sistema Cassol Mapeamento Regional.
Responda APENAS com base nas informações fornecidas abaixo.
Se a informação não estiver disponível, diga que não encontrou dados suficientes.
Seja conciso e objetivo. Use português brasileiro.

CONTEXTO:
{chunks_recuperados}

HISTÓRICO:
{historico}

PERGUNTA:
{mensagem}
```

## Tratamento de Erros

| Cenário | Ação |
|---------|------|
| Ollama offline | Fallback automático para OpenAI |
| Ambos LLMs offline | Retorna erro amigável: "Assistente temporariamente indisponível" |
| Nenhum chunk encontrado | LLM responde com "Não encontrei dados sobre isso" |
| Timeout (30s) | Interrompe stream, retorna resposta parcial |
| Token expirado | 401 → redirect para login |

## Segurança

- Todas as rotas `/api/ia/*` protegidas por `withAuth()`
- Chunks expõem apenas dados que o usuário já tem acesso via role (admin vê tudo, agente vê dados filtrados)
- Histórico de conversas associado ao usuário — cada um vê apenas suas conversas
- Prompt system delimita estritamente o escopo de resposta
- Embeddings e LLM chamados server-side, nunca expostos ao cliente

## Testes

| Tipo | O que testar |
|------|-------------|
| Unitário | Geração de chunks, parsing de metadata, formatação de prompt |
| Integração | POST /api/ia/chat com SSE, criação de conversa, reindexação |
| Mock | Comportamento com Ollama offline, fallback para OpenAI, timeout |
| E2E | Fluxo completo: digitar pergunta → ver resposta streamada → nova pergunta na mesma conversa |
