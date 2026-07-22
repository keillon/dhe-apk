-- Atualiza QR Codes dos equipamentos KM 2700 para o código físico impresso
UPDATE "equipamentos"
SET "qr_code" = 'KM 2700-4', "updated_at" = CURRENT_TIMESTAMP
WHERE ("nome" = 'KM 2700-4' OR "patrimonio" = 'KM-2700-4')
  AND "qr_code" <> 'KM 2700-4';

UPDATE "equipamentos"
SET "qr_code" = 'KM 2700-3', "updated_at" = CURRENT_TIMESTAMP
WHERE ("nome" = 'KM 2700-3' OR "patrimonio" = 'KM-2700-3')
  AND "qr_code" <> 'KM 2700-3';

-- Garante data da última limpeza nas inspeções mais recentes desses equipamentos
UPDATE "inspecoes" i
SET "data_ultima_limpeza" = DATE '2026-03-25'
FROM "equipamentos" e
WHERE i."equipamento_id" = e."id"
  AND (e."qr_code" = 'KM 2700-4' OR e."nome" = 'KM 2700-4' OR e."patrimonio" = 'KM-2700-4')
  AND i."id" = (
    SELECT i2."id" FROM "inspecoes" i2
    WHERE i2."equipamento_id" = e."id"
    ORDER BY i2."created_at" DESC
    LIMIT 1
  );

UPDATE "inspecoes" i
SET "data_ultima_limpeza" = DATE '2026-03-30'
FROM "equipamentos" e
WHERE i."equipamento_id" = e."id"
  AND (e."qr_code" = 'KM 2700-3' OR e."nome" = 'KM 2700-3' OR e."patrimonio" = 'KM-2700-3')
  AND i."id" = (
    SELECT i2."id" FROM "inspecoes" i2
    WHERE i2."equipamento_id" = e."id"
    ORDER BY i2."created_at" DESC
    LIMIT 1
  );
