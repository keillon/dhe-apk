-- =============================================================================
-- Script SEGURO para PostgreSQL existente na VPS
-- Cria APENAS o banco dhe_hidraulicos e o usuário dhe_app
-- NÃO apaga, NÃO altera outros bancos
-- =============================================================================

-- 1. Criar banco (somente se não existir)
SELECT 'CREATE DATABASE dhe_hidraulicos'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'dhe_hidraulicos'
)\gexec

-- 2. Criar usuário (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dhe_app') THEN
    CREATE USER dhe_app WITH PASSWORD 'ALTERE_ESTA_SENHA';
  END IF;
END
$$;

-- 3. Permissões APENAS no banco DHE
GRANT ALL PRIVILEGES ON DATABASE dhe_hidraulicos TO dhe_app;

-- Execute os comandos abaixo CONECTADO ao banco dhe_hidraulicos:
-- \c dhe_hidraulicos
-- GRANT ALL ON SCHEMA public TO dhe_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dhe_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dhe_app;
