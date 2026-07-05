# Upload de Anexos — Cassol Mapeamento Regional

## Visão Geral

Sistema de upload de arquivos para anexar a demandas, contatos e interações do CRM. Armazenamento local com serviço via API autenticada.

## Requisitos

- Tipos de arquivo: qualquer
- Tamanho máximo: 2MB por arquivo
- Quantidade: sem limite por entidade
- Entidades vinculadas: demanda, contato, interação (CRM)

## Modelo de Dados

```prisma
model Anexo {
  id           String   @id @default(cuid())
  nomeOriginal String
  nomeArquivo  String   @unique   // uuid + extensão
  tamanho      Int                // bytes
  mimeType     String
  entidadeTipo String             // "demanda" | "contato" | "interacao"
  entidadeId   String
  criadoPor    String?
  createdAt    DateTime @default(now())
}
```

Relacionamento polimórfico — sem FK no banco. O vínculo é por `entidadeTipo` + `entidadeId`. Consultas filtram por esses campos.

## Armazenamento

Diretório `uploads/` na raiz do projeto (fora de `public/`). Nomenclatura:
```
uploads/<ano>/<mes>/<uuid>-<nomeOriginal>
```

Exemplo: `uploads/2026/07/a1b2c3-d4e5-relatorio-visita.pdf`

Arquivos servidos exclusivamente via endpoint autenticado, nunca acessíveis publicamente.

## API Routes

### POST `/api/anexos`
Upload de arquivo. Content-Type: `multipart/form-data`.

**Campos:**
- `arquivo` — File (obrigatório)
- `entidadeTipo` — String (obrigatório: "demanda" | "contato" | "interacao")
- `entidadeId` — String (obrigatório)

**Validações:**
- Arquivo presente
- Tamanho ≤ 2MB
- entidadeTipo válido
- Autenticação via `withAuth()`

**Resposta (201):** `{ id, nomeOriginal, nomeArquivo, tamanho, mimeType, createdAt }`

**Erros:** 400 (validação), 401 (não autenticado), 413 (tamanho excedido)

### GET `/api/anexos?entidadeTipo=&entidadeId=`
Listar anexos de uma entidade.

**Resposta (200):** `Anexo[]` (sem o campo `nomeArquivo` por segurança)

### GET `/api/anexos/[id]/arquivo`
Download do arquivo. Header `Content-Disposition: inline` para navegador exibir ou baixar conforme o tipo.

**Resposta:** Stream do arquivo com `Content-Type` correto.

### DELETE `/api/anexos/[id]`
Remove o registro e o arquivo do disco.

**Resposta (204):** sem corpo.

**Segurança:** verifica se o usuário tem permissão (admin sempre; agente apenas anexos que criou).

## Componentes React

### `src/components/anexos/AnexosUpload.tsx`
- Botão/link "Adicionar anexo"
- Input file escondido com `accept` livre
- Valida tamanho client-side (2MB)
- Upload via `fetch` com `FormData`
- Exibe progresso (opcional)
- Retorna callback `onUpload` com o anexo criado

### `src/components/anexos/AnexosLista.tsx`
- Props: `entidadeTipo`, `entidadeId` (busca anexos via API)
- Tabela simples: nome, tamanho formatado, data, ações (download, deletar)
- Download abre o arquivo em nova aba
- Delete com confirmação
- Atualiza lista automaticamente após upload/delete

## Integração com Módulos Existentes

### Demandas
- `FormularioDemanda.tsx` — adicionar `AnexosUpload` abaixo do formulário
- `ModalDemanda.tsx` — adicionar `AnexosLista` na seção de detalhes, `AnexosUpload` no modo edição

### CRM Contatos
- `ModalContato.tsx` — adicionar `AnexosLista` nos detalhes

### CRM Interações
- `TimelineInteracoes.tsx` — adicionar `AnexosLista` por interação (ou anexo único vinculado à interação)

## Configuração

### next.config.ts
```ts
const nextConfig = {
  experimental: {},
  // bodyParser size para upload de até 2MB
}
```

O Next.js já aceita body até 4MB por padrão para API routes com `request.formData()`, então 2MB está OK. Apenas validar no servidor.

### Scripts
Seed não precisa de alteração.

## Segurança

- Todo upload exige autenticação
- Arquivos servidos via API, nunca direto pelo nginx
- Validação de tipo MIME no servidor (opcional, mas recomendado)
- Sanitização de nome de arquivo (remover caracteres especiais, usar UUID)
- Verificação de tamanho antes de gravar
- Delete só permite que o criador ou admin remova

## Não Escopo (para versão futura)

- Preview de imagens inline
- Upload múltiplo simultâneo
- Storage externo (S3)
- OCR de documentos
- Thumbnails
