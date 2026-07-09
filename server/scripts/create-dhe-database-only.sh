#!/bin/bash
# =============================================================================
# Script SEGURO — cria APENAS o banco dhe_hidraulicos no PostgreSQL existente.
# NÃO apaga, NÃO altera e NÃO toca em outros bancos.
# =============================================================================
set -euo pipefail

DB_NAME="dhe_hidraulicos"
DB_USER="dhe_app"
DB_PASSWORD="${DHE_DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
  echo "ERRO: Defina DHE_DB_PASSWORD antes de executar."
  echo "Exemplo: DHE_DB_PASSWORD='senha_forte' ./create-dhe-database-only.sh"
  exit 1
fi

echo "==> Verificando se o banco '$DB_NAME' já existe..."
EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$EXISTS" = "1" ]; then
  echo "Banco '$DB_NAME' já existe. Nenhuma ação necessária."
else
  echo "==> Criando banco '$DB_NAME' (somente este banco)..."
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
  echo "Banco '$DB_NAME' criado com sucesso."
fi

echo "==> Verificando usuário '$DB_USER'..."
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")

if [ "$USER_EXISTS" != "1" ]; then
  echo "==> Criando usuário '$DB_USER'..."
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
else
  echo "Usuário '$DB_USER' já existe. Pulando criação."
fi

echo "==> Concedendo permissões APENAS no banco '$DB_NAME'..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

echo ""
echo "✅ Concluído com segurança."
echo "   Banco criado: $DB_NAME"
echo "   Usuário:      $DB_USER"
echo "   Outros bancos: INTOCADOS"
echo ""
echo "DATABASE_URL=postgresql://$DB_USER:SENHA@localhost:5432/$DB_NAME?schema=public"
