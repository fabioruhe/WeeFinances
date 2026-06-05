-- CreateEnum
CREATE TYPE "CategoriaFonte" AS ENUM ('SISTEMA', 'USUARIO', 'MANUAL');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "categoriaFonte" "CategoriaFonte",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
