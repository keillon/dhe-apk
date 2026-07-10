-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('planejada', 'em_andamento', 'concluida');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('equipamento', 'cliente');

-- AlterTable
ALTER TABLE "equipamentos" ADD COLUMN "tipo" TEXT;

-- AlterTable
ALTER TABLE "notificacoes" ADD COLUMN "push_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "itens" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_diarias" (
    "id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "status" "RouteStatus" NOT NULL DEFAULT 'planejada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotas_diarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rota_itens" (
    "id" TEXT NOT NULL,
    "rota_id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "visitado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rota_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entidade" "AuditEntity" NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_tipo_key" ON "checklist_templates"("tipo");

-- CreateIndex
CREATE INDEX "equipamentos_patrimonio_idx" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE INDEX "equipamentos_proxima_manutencao_idx" ON "equipamentos"("proxima_manutencao");

-- CreateIndex
CREATE UNIQUE INDEX "rotas_diarias_tecnico_id_data_key" ON "rotas_diarias"("tecnico_id", "data");

-- CreateIndex
CREATE INDEX "rota_itens_rota_id_idx" ON "rota_itens"("rota_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_usuario_id_idx" ON "password_reset_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidade_id_idx" ON "audit_logs"("entidade", "entidade_id");

-- AddForeignKey
ALTER TABLE "rotas_diarias" ADD CONSTRAINT "rotas_diarias_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rota_itens" ADD CONSTRAINT "rota_itens_rota_id_fkey" FOREIGN KEY ("rota_id") REFERENCES "rotas_diarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rota_itens" ADD CONSTRAINT "rota_itens_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default checklist templates
INSERT INTO "checklist_templates" ("id", "tipo", "nome", "itens", "created_at", "updated_at")
VALUES
(
  'default-prensa',
  'prensa',
  'Prensa Hidráulica',
  '[{"key":"vazamentos","label":"Vazamentos","obrigatorio":true},{"key":"mangueiras","label":"Mangueiras","obrigatorio":true},{"key":"cilindros","label":"Cilindros","obrigatorio":true},{"key":"motor","label":"Motor","obrigatorio":true},{"key":"bomba","label":"Bomba","obrigatorio":true},{"key":"pressao","label":"Pressão","obrigatorio":true},{"key":"temperatura","label":"Temperatura","obrigatorio":false},{"key":"filtros","label":"Filtros","obrigatorio":false},{"key":"ruidos","label":"Ruídos anormais","obrigatorio":false},{"key":"acoplamentos","label":"Acoplamentos","obrigatorio":false}]',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'default-injetora',
  'injetora',
  'Injetora',
  '[{"key":"vazamentos","label":"Vazamentos","obrigatorio":true},{"key":"mangueiras","label":"Mangueiras","obrigatorio":true},{"key":"cilindros","label":"Cilindros","obrigatorio":true},{"key":"motor","label":"Motor","obrigatorio":true},{"key":"bomba","label":"Bomba","obrigatorio":true},{"key":"pressao","label":"Pressão","obrigatorio":true},{"key":"temperatura","label":"Temperatura","obrigatorio":true},{"key":"filtros","label":"Filtros","obrigatorio":true},{"key":"ruidos","label":"Ruídos anormais","obrigatorio":false},{"key":"acoplamentos","label":"Acoplamentos","obrigatorio":false}]',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'default-geral',
  'geral',
  'Equipamento Geral',
  '[{"key":"vazamentos","label":"Vazamentos","obrigatorio":true},{"key":"mangueiras","label":"Mangueiras","obrigatorio":true},{"key":"cilindros","label":"Cilindros","obrigatorio":true},{"key":"motor","label":"Motor","obrigatorio":true},{"key":"bomba","label":"Bomba","obrigatorio":true},{"key":"pressao","label":"Pressão","obrigatorio":true},{"key":"temperatura","label":"Temperatura","obrigatorio":false},{"key":"filtros","label":"Filtros","obrigatorio":false},{"key":"ruidos","label":"Ruídos anormais","obrigatorio":false},{"key":"acoplamentos","label":"Acoplamentos","obrigatorio":false}]',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
