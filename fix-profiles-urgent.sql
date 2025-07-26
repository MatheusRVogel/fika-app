-- CORREÇÃO URGENTE - ADICIONAR CAMPOS FALTANTES
-- Execute este SQL no Supabase Dashboard

-- 1. Adicionar campos faltantes na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes e criar novas permissivas
DROP POLICY IF EXISTS "allow_profile_creation" ON profiles;
DROP POLICY IF EXISTS "allow_settings_creation" ON user_settings;

-- Criar política permissiva para criação de perfis
CREATE POLICY "allow_profile_creation" ON profiles
    FOR INSERT WITH CHECK (true);

-- Criar política permissiva para configurações
CREATE POLICY "allow_settings_creation" ON user_settings
    FOR INSERT WITH CHECK (true);

-- 5. Verificar se funcionou
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('email', 'latitude', 'longitude')
ORDER BY column_name;