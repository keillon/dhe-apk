-- Remove duplicatas ativas (mesmo usuário + equipamento + tipo), mantendo a mais recente.
DELETE FROM "notificacoes" AS n
USING "notificacoes" AS newer
WHERE n.equipamento_id IS NOT NULL
  AND newer.equipamento_id IS NOT NULL
  AND n.usuario_id = newer.usuario_id
  AND n.equipamento_id = newer.equipamento_id
  AND n.tipo = newer.tipo
  AND n.id <> newer.id
  AND (
    newer.created_at > n.created_at
    OR (newer.created_at = n.created_at AND newer.id > n.id)
  );

-- Também remove duplicatas sem equipamento (mantém a mais recente por usuário+tipo).
DELETE FROM "notificacoes" AS n
USING "notificacoes" AS newer
WHERE n.equipamento_id IS NULL
  AND newer.equipamento_id IS NULL
  AND n.usuario_id = newer.usuario_id
  AND n.tipo = newer.tipo
  AND n.id <> newer.id
  AND (
    newer.created_at > n.created_at
    OR (newer.created_at = n.created_at AND newer.id > n.id)
  );

CREATE UNIQUE INDEX "notificacoes_usuario_equipamento_tipo_uidx"
ON "notificacoes" ("usuario_id", "equipamento_id", "tipo");
