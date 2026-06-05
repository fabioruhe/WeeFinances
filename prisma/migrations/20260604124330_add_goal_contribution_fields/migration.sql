-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "contribuicaoA" DECIMAL(12,2),
ADD COLUMN     "contribuicaoB" DECIMAL(12,2),
ADD COLUMN     "prioridade" INTEGER NOT NULL DEFAULT 0;
