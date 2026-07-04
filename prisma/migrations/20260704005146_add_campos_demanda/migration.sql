-- AlterTable
ALTER TABLE "Demanda" ADD COLUMN     "responsavel" TEXT,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'rotina';
