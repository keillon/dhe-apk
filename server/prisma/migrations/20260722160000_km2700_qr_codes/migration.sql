-- Atualiza DHE-0001 / DHE-0002 com os dados oficiais KM 2700
UPDATE "equipamentos"
SET
  "nome" = 'KM 2700-3',
  "patrimonio" = 'KM-2700-3',
  "marca" = 'Krauss Maffei',
  "modelo" = 'KM 2700-3',
  "numero_serie" = 'SN-0758922',
  "ano" = 2016,
  "localizacao" = 'Injeção',
  "tipo" = 'Injetora',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "qr_code" = 'DHE-0001';

UPDATE "equipamentos"
SET
  "nome" = 'KM 2700-4',
  "patrimonio" = 'KM-2700-4',
  "marca" = 'Krauss Maffei',
  "modelo" = 'KM 2700-4',
  "numero_serie" = 'SN-0758974',
  "ano" = 2015,
  "localizacao" = 'Injeção',
  "tipo" = 'Injetora',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "qr_code" = 'DHE-0002';

-- Remove cadastros duplicados criados anteriormente com QR automático
DELETE FROM "fotos"
WHERE "inspecao_id" IN (
  SELECT i."id" FROM "inspecoes" i
  INNER JOIN "equipamentos" e ON e."id" = i."equipamento_id"
  WHERE e."qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "assinaturas"
WHERE "inspecao_id" IN (
  SELECT i."id" FROM "inspecoes" i
  INNER JOIN "equipamentos" e ON e."id" = i."equipamento_id"
  WHERE e."qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "historicos"
WHERE "equipamento_id" IN (
  SELECT "id" FROM "equipamentos" WHERE "qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "inspecoes"
WHERE "equipamento_id" IN (
  SELECT "id" FROM "equipamentos" WHERE "qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "notificacoes"
WHERE "equipamento_id" IN (
  SELECT "id" FROM "equipamentos" WHERE "qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "rota_itens"
WHERE "equipamento_id" IN (
  SELECT "id" FROM "equipamentos" WHERE "qr_code" IN ('DHE-0004', 'DHE-0005')
);

DELETE FROM "equipamentos"
WHERE "qr_code" IN ('DHE-0004', 'DHE-0005');

-- Garante última limpeza de reservatório
UPDATE "inspecoes" i
SET "data_ultima_limpeza" = DATE '2026-03-30'
FROM "equipamentos" e
WHERE i."equipamento_id" = e."id"
  AND e."qr_code" = 'DHE-0001'
  AND i."id" = (
    SELECT i2."id" FROM "inspecoes" i2
    WHERE i2."equipamento_id" = e."id"
    ORDER BY i2."created_at" DESC
    LIMIT 1
  );

UPDATE "inspecoes" i
SET "data_ultima_limpeza" = DATE '2026-03-25'
FROM "equipamentos" e
WHERE i."equipamento_id" = e."id"
  AND e."qr_code" = 'DHE-0002'
  AND i."id" = (
    SELECT i2."id" FROM "inspecoes" i2
    WHERE i2."equipamento_id" = e."id"
    ORDER BY i2."created_at" DESC
    LIMIT 1
  );
