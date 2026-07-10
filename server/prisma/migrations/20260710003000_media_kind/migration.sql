-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('image', 'video');

-- AlterTable
ALTER TABLE "fotos" ADD COLUMN "media_kind" "MediaKind" NOT NULL DEFAULT 'image';
