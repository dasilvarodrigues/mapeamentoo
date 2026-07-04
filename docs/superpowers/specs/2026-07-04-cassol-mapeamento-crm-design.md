# CRM Comunitário — Design

## 1. Visão Geral

Módulo de CRM comunitário para cadastro de contatos (líderes, moradores, representantes) e registro de interações (visitas, ligações, reuniões, mensagens). Contatos vinculados à hierarquia territorial (bairro/comunidade) e interações vinculadas a contatos e opcionalmente a demandas.

## 2. Schema

### Contato

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String` | CUID |
| `nome` | `String` | Nome completo |
| `telefone` | `String` | Telefone/WhatsApp |
| `email` | `String?` | E-mail |
| `cargo` | `String?` | Função na comunidade (líder, presidente, etc.) |
| `redesSociais` | `Json?` | Redes sociais ({"instagram": "...", "facebook": "..."}) |
| `bairroId` | `String?` | FK → Bairro |
| `bairro` | `Bairro?` | Relação |
| `comunidadeId` | `String?` | FK → Comunidade |
| `comunidade` | `Comunidade?` | Relação |
| `observacoes` | `String?` | Anotações livres |
| `createdAt` | `DateTime` | auto |
| `updatedAt` | `DateTime` | auto |

### Interacao

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String` | CUID |
| `tipo` | `String` | visita, ligacao, reuniao, mensagem |
| `descricao` | `String` | Relato da interação |
| `data` | `DateTime` | Data da interação |
| `responsavel` | `String` | Quem realizou |
| `contatoId` | `String` | FK → Contato |
| `contato` | `Contato` | Relação |
| `demandaId` | `String?` | FK → Demanda (opcional) |
| `demanda` | `Demanda?` | Relação |
| `createdAt` | `DateTime` | auto |

## 3. Páginas

Única página `/crm` com:
- Lista de contatos com busca textual
- Clique em contato → modal de detalhes com timeline de interações
- Botão "Novo Contato" → modal de formulário
- Botão "Nova Interação" → modal de formulário (dentro do detalhe do contato)

## 4. API

### Contatos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/crm/contatos?busca=&bairroId=` | Listar contatos |
| GET | `/api/crm/contatos/[id]` | Detalhe |
| POST | `/api/crm/contatos` | Criar |
| PUT | `/api/crm/contatos/[id]` | Atualizar |
| DELETE | `/api/crm/contatos/[id]` | Excluir |

### Interações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/crm/interacoes?contatoId=` | Listar interações de um contato |
| POST | `/api/crm/interacoes` | Criar interação |

## 5. Componentes

```
src/components/crm/
├── ListaContatos.tsx       — Tabela de contatos com busca
├── TimelineInteracoes.tsx  — Timeline vertical de interações
├── FormularioContato.tsx   — Formulário criar/editar contato
├── FormularioInteracao.tsx — Formulário registrar interação
└── ModalContato.tsx        — Modal detalhes + timeline
```

## 6. Layout da Página

```
┌───────────────────────────────────────────────────────┐
│  CRM Comunitário               [Botão Novo Contato]   │
├───────────────────────────────────────────────────────┤
│  [Busca por nome...                           🔍]    │
├───────────────────────────────────────────────────────┤
│  ┌───┬──────────┬──────────────┬──────────┬────────┐ │
│  │ # │  Nome    │   Telefone   │  Cargo   │ Bairro │ │
│  ├───┼──────────┼──────────────┼──────────┼────────┤ │
│  │ 1 │ Maria... │ (11) 9999.. │ Líder    │ ZN     │ │
│  │ 2 │ João...  │ (11) 8888.. │ Presid.  │ ZS     │ │
│  └───┴──────────┴──────────────┴──────────┴────────┘ │
└───────────────────────────────────────────────────────┘
```

### Modal de Detalhes

```
┌─────────────────────────────────────┐
│  Maria Silva              [✕]       │
├─────────────────────────────────────┤
│  Telefone: (11) 99999-0000         │
│  Email:   maria@email.com          │
│  Cargo:   Líder Comunitária        │
│  Bairro:  Santana (Zona Norte)     │
│  Redes:   @maria.silva (IG)        │
├─────────────────────────────────────┤
│  Timeline de Interações             │
│  ┌─────────────────────────────┐   │
│  │ ● 02/07 - Visita           │   │
│  │   Reunião na associação... │   │
│  ├─────────────────────────────┤   │
│  │ ● 25/06 - Ligação          │   │
│  │   Confirmou presença...    │   │
│  └─────────────────────────────┘   │
│  [Nova Interação]    [Editar] [Del]│
└─────────────────────────────────────┘
```

## 7. Próximos Passos (fora deste escopo)

- Exportar contatos (CSV)
- Importar contatos em lote
- Associação com visitas técnicas (modelo Visita existente)
- Envio de mensagens em massa (WhatsApp/email)
