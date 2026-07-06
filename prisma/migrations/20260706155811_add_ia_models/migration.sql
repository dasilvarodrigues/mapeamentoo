CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "IaChunk" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(768),
    "fonte" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IaChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IaConversa" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Nova conversa',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IaConversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IaMensagem" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "chunksFonte" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IaMensagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IaConversa" ADD CONSTRAINT "IaConversa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IaMensagem" ADD CONSTRAINT "IaMensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "IaConversa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX ON "IaChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
