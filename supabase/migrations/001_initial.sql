-- DHE Componentes Hidráulicos - Schema do Banco de Dados
-- Supabase / PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuários (técnicos)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'Técnico',
  empresa TEXT NOT NULL DEFAULT 'DHE Componentes Hidráulicos',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code TEXT UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  empresa TEXT NOT NULL,
  nome TEXT NOT NULL,
  patrimonio TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  ano INTEGER NOT NULL,
  localizacao TEXT NOT NULL,
  foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'operando' CHECK (status IN ('operando', 'parado', 'manutencao')),
  ultima_inspecao TIMESTAMPTZ,
  proxima_manutencao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inspeções
CREATE TABLE IF NOT EXISTS inspecoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipamento_id UUID NOT NULL REFERENCES equipamentos(id),
  tecnico_id UUID NOT NULL REFERENCES usuarios(id),
  nivel_oleo INTEGER NOT NULL CHECK (nivel_oleo >= 0 AND nivel_oleo <= 100),
  contaminacao_oleo TEXT NOT NULL CHECK (contaminacao_oleo IN ('baixa', 'media', 'alta')),
  data_ultima_limpeza DATE,
  complemento TEXT,
  checklist JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico (cópia imutável de cada inspeção)
CREATE TABLE IF NOT EXISTS historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspecao_id UUID NOT NULL REFERENCES inspecoes(id),
  equipamento_id UUID NOT NULL REFERENCES equipamentos(id),
  tecnico_id UUID NOT NULL REFERENCES usuarios(id),
  dados JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fotos das inspeções
CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspecao_id UUID NOT NULL REFERENCES inspecoes(id),
  url TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('antes', 'depois')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspecao_id UUID NOT NULL REFERENCES inspecoes(id),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  equipamento_id UUID REFERENCES equipamentos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('inspecao_pendente', 'manutencao_vencida', 'oleo_contaminado')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_equipamentos_qr_code ON equipamentos(qr_code);
CREATE INDEX IF NOT EXISTS idx_equipamentos_cliente_id ON equipamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_status ON equipamentos(status);
CREATE INDEX IF NOT EXISTS idx_inspecoes_equipamento_id ON inspecoes(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_inspecoes_tecnico_id ON inspecoes(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_inspecoes_created_at ON inspecoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_equipamento_id ON historico(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER equipamentos_updated_at BEFORE UPDATE ON equipamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: toda inspeção gera histórico
CREATE OR REPLACE FUNCTION criar_historico_inspecao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico (inspecao_id, equipamento_id, tecnico_id, dados)
  VALUES (
    NEW.id,
    NEW.equipamento_id,
    NEW.tecnico_id,
    jsonb_build_object(
      'nivel_oleo', NEW.nivel_oleo,
      'contaminacao_oleo', NEW.contaminacao_oleo,
      'data_ultima_limpeza', NEW.data_ultima_limpeza,
      'complemento', NEW.complemento,
      'checklist', NEW.checklist,
      'created_at', NEW.created_at
    )
  );

  UPDATE equipamentos
  SET ultima_inspecao = NEW.created_at
  WHERE id = NEW.equipamento_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspecao_cria_historico AFTER INSERT ON inspecoes
  FOR EACH ROW EXECUTE FUNCTION criar_historico_inspecao();

-- Dados de demonstração
INSERT INTO clientes (id, nome, empresa, email, telefone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Carlos Mendes', 'FMM Indústria', 'carlos@fmm.com.br', '(41) 99999-0001'),
  ('22222222-2222-2222-2222-222222222222', 'Ana Paula', 'Metalúrgica Sul', 'ana@metalsul.com.br', '(41) 99999-0002')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (id, email, nome, cargo) VALUES
  ('33333333-3333-3333-3333-333333333333', 'tecnico@dhepr.com.br', 'João Silva', 'Técnico Hidráulico')
ON CONFLICT DO NOTHING;

INSERT INTO equipamentos (id, qr_code, cliente_id, empresa, nome, patrimonio, marca, modelo, numero_serie, ano, localizacao, status, ultima_inspecao, proxima_manutencao) VALUES
  ('44444444-4444-4444-4444-444444444444', 'DHE-0001', '11111111-1111-1111-1111-111111111111', 'FMM Indústria', 'Prensa Hidráulica 500T', 'PAT-001', 'Parker', 'PH-500', 'SN-2020-001', 2020, 'Setor A - Linha 1', 'operando', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days'),
  ('55555555-5555-5555-5555-555555555555', 'DHE-0002', '11111111-1111-1111-1111-111111111111', 'FMM Indústria', 'Injetora Hidráulica', 'PAT-002', 'Bosch', 'IH-200', 'SN-2019-045', 2019, 'Setor B - Linha 3', 'manutencao', NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
  ('66666666-6666-6666-6666-666666666666', 'DHE-0003', '22222222-2222-2222-2222-222222222222', 'Metalúrgica Sul', 'Guindaste Hidráulico', 'PAT-003', 'Liebherr', 'GH-50', 'SN-2021-112', 2021, 'Pátio Externo', 'operando', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days')
ON CONFLICT DO NOTHING;
