-- CORREÇÃO RLS - VERSÃO SIMPLES
-- Execute uma linha por vez no Supabase Dashboard

-- 1. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem criar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem criar próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Sistema pode criar matches" ON matches;
DROP POLICY IF EXISTS "Usuários podem visualizar stories" ON story_views;
DROP POLICY IF EXISTS "Usuários podem fazer denúncias" ON reports;

-- 2. Criar políticas para profiles
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Criar políticas para user_settings
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Criar políticas para matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- 5. Criar políticas para story_views
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 6. Criar políticas para reports
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 7. Verificar se as políticas foram criadas
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';