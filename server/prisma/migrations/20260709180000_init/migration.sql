-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('operando', 'parado', 'manutencao');

-- CreateEnum
CREATE TYPE "OilContamination" AS ENUM ('baixa', 'media', 'alta');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('inspecao_pendente', 'manutencao_vencida', 'oleo_contaminado');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('antes', 'depois');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'Técnico',
    "empresa" TEXT NOT NULL DEFAULT 'DHE Componentes Hidráulicos',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numero_serie" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "localizacao" TEXT NOT NULL,
    "foto_url" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'operando',
    "ultima_inspecao" TIMESTAMP(3),
    "proxima_manutencao" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecoes" (
    "id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "nivel_oleo" INTEGER NOT NULL,
    "contaminacao_oleo" "OilContamination" NOT NULL,
    "data_ultima_limpeza" DATE,
    "complemento" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico" (
    "id" TEXT NOT NULL,
    "inspecao_id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" TEXT NOT NULL,
    "inspecao_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "PhotoType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "inspecao_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "equipamento_id" TEXT,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_qr_code_key" ON "equipamentos"("qr_code");

-- CreateIndex
CREATE INDEX "equipamentos_cliente_id_idx" ON "equipamentos"("cliente_id");

-- CreateIndex
CREATE INDEX "equipamentos_status_idx" ON "equipamentos"("status");

-- CreateIndex
CREATE INDEX "inspecoes_equipamento_id_idx" ON "inspecoes"("equipamento_id");

-- CreateIndex
CREATE INDEX "inspecoes_tecnico_id_idx" ON "inspecoes"("tecnico_id");

-- CreateIndex
CREATE INDEX "inspecoes_created_at_idx" ON "inspecoes"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "historico_inspecao_id_key" ON "historico"("inspecao_id");

-- CreateIndex
CREATE INDEX "historico_equipamento_id_idx" ON "historico"("equipamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_inspecao_id_key" ON "assinaturas"("inspecao_id");

-- CreateIndex
CREATE INDEX "notificacoes_usuario_id_idx" ON "notificacoes"("usuario_id");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico" ADD CONSTRAINT "historico_inspecao_id_fkey" FOREIGN KEY ("inspecao_id") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico" ADD CONSTRAINT "historico_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico" ADD CONSTRAINT "historico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_inspecao_id_fkey" FOREIGN KEY ("inspecao_id") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_inspecao_id_fkey" FOREIGN KEY ("inspecao_id") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
