-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'tecnico');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'tecnico';
ALTER TABLE "usuarios" ADD COLUMN "foto_url" TEXT;
