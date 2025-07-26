-- CORREÇÃO FINAL URGENTE - SEM ERROS DE SINTAXE
-- Execute este SQL no Supabase Dashboard

-- 1. Adicionar campos faltantes na tabela profiles (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='latitude') THEN
        ALTER TABLE profiles ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='longitude') THEN
        ALTER TABLE profiles ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- 2. Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "allow_profile_creation" ON profiles;
DROP POLICY IF EXISTS "allow_settings_creation" ON user_settings;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_settings" ON user_settings;

-- 4. Criar políticas permissivas para desenvolvimento
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar se funcionou
SELECT 
    'profiles' as tabela,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('email', 'latitude', 'longitude')
ORDER BY column_name;