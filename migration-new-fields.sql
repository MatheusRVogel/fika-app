-- Migração para adicionar novos campos ao perfil do usuário
-- Execute este script no SQL Editor do Supabase

-- Adicionar novos campos à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS relationship_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gender_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS age_confirmed BOOLEAN DEFAULT FALSE;

-- Política para permitir inserção de perfis
CREATE POLICY IF NOT EXISTS "Usuários podem inserir próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Comentários para documentação
COMMENT ON COLUMN profiles.birthdate IS 'Data de nascimento do usuário';
COMMENT ON COLUMN profiles.relationship_types IS 'Tipos de relacionamento que o usuário busca';
COMMENT ON COLUMN profiles.looking_for IS 'O que o usuário está procurando';
COMMENT ON COLUMN profiles.gender_preferences IS 'Preferências de gênero do usuário';
COMMENT ON COLUMN profiles.age_confirmed IS 'Se o usuário confirmou ter mais de 18 anos';