-- CORREÇÃO RLS COMPLETA E FUNCIONAL
-- Execute este SQL no Supabase Dashboard
-- Mantém RLS ativo com políticas corretas

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuários podem criar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem criar próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Sistema pode criar matches" ON matches;
DROP POLICY IF EXISTS "Usuários podem visualizar stories" ON story_views;
DROP POLICY IF EXISTS "Usuários podem fazer denúncias" ON reports;

-- Remover outras políticas que possam existir
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_user_settings" ON user_settings;
DROP POLICY IF EXISTS "allow_all_matches" ON matches;
DROP POLICY IF EXISTS "allow_all_story_views" ON story_views;
DROP POLICY IF EXISTS "allow_all_reports" ON reports;

-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS FUNCIONAIS PARA PROFILES
-- Permitir SELECT para usuários autenticados
CREATE POLICY "profiles_select" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir INSERT para usuários autenticados (próprio perfil) ou sistema
CREATE POLICY "profiles_insert" ON profiles
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.uid() = id OR
        auth.uid() IS NOT NULL
    );

-- Permitir UPDATE do próprio perfil
CREATE POLICY "profiles_update" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permitir DELETE do próprio perfil
CREATE POLICY "profiles_delete" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 4. CRIAR POLÍTICAS FUNCIONAIS PARA USER_SETTINGS
CREATE POLICY "user_settings_select" ON user_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_settings_insert" ON user_settings
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.uid() = user_id OR
        auth.uid() IS NOT NULL
    );

CREATE POLICY "user_settings_update" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 5. CRIAR POLÍTICAS FUNCIONAIS PARA MATCHES
CREATE POLICY "matches_select" ON matches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "matches_insert" ON matches
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.uid() IS NOT NULL
    );

CREATE POLICY "matches_update" ON matches
    FOR UPDATE USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "matches_delete" ON matches
    FOR DELETE USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id OR
        auth.role() = 'service_role'
    );

-- 6. CRIAR POLÍTICAS FUNCIONAIS PARA STORY_VIEWS
CREATE POLICY "story_views_select" ON story_views
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "story_views_insert" ON story_views
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.uid() = viewer_id OR
        auth.uid() IS NOT NULL
    );

CREATE POLICY "story_views_update" ON story_views
    FOR UPDATE USING (auth.uid() = viewer_id);

CREATE POLICY "story_views_delete" ON story_views
    FOR DELETE USING (auth.uid() = viewer_id);

-- 7. CRIAR POLÍTICAS FUNCIONAIS PARA REPORTS
CREATE POLICY "reports_select" ON reports
    FOR SELECT USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "reports_insert" ON reports
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role' OR
        auth.uid() = reporter_id OR
        auth.uid() IS NOT NULL
    );

CREATE POLICY "reports_update" ON reports
    FOR UPDATE USING (
        auth.uid() = reporter_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "reports_delete" ON reports
    FOR DELETE USING (
        auth.uid() = reporter_id OR
        auth.role() = 'service_role'
    );

-- 8. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'matches', 'story_views', 'reports')
ORDER BY tablename, policyname;

-- 9. VERIFICAR STATUS RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'matches', 'story_views', 'reports')
ORDER BY tablename;