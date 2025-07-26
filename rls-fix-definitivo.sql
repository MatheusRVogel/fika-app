-- CORREÇÃO DEFINITIVA PARA RLS E FOREIGN KEYS
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR FOREIGN KEYS
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='profiles';

-- 3. VERIFICAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'matches', 'story_views', 'reports');

-- 4. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. REMOVER FOREIGN KEY PROBLEMÁTICA (se existir)
-- Isso permite inserções de teste sem depender de auth.users
DO $$ 
BEGIN
    -- Verificar se a constraint existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Foreign key constraint profiles_id_fkey removida';
    ELSE
        RAISE NOTICE 'Foreign key constraint profiles_id_fkey não existe';
    END IF;
END $$;

-- 6. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 7. REMOVER POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;

DROP POLICY IF EXISTS "matches_select_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_update_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_policy" ON public.matches;

DROP POLICY IF EXISTS "story_views_select_policy" ON public.story_views;
DROP POLICY IF EXISTS "story_views_insert_policy" ON public.story_views;
DROP POLICY IF EXISTS "story_views_update_policy" ON public.story_views;
DROP POLICY IF EXISTS "story_views_delete_policy" ON public.story_views;

DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON public.reports;

-- 8. CRIAR POLÍTICAS PERMISSIVAS PARA DESENVOLVIMENTO
-- PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (true);

-- USER_SETTINGS
CREATE POLICY "user_settings_select_policy" ON public.user_settings
    FOR SELECT USING (true);

CREATE POLICY "user_settings_insert_policy" ON public.user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "user_settings_update_policy" ON public.user_settings
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "user_settings_delete_policy" ON public.user_settings
    FOR DELETE USING (true);

-- MATCHES
CREATE POLICY "matches_select_policy" ON public.matches
    FOR SELECT USING (true);

CREATE POLICY "matches_insert_policy" ON public.matches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "matches_update_policy" ON public.matches
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "matches_delete_policy" ON public.matches
    FOR DELETE USING (true);

-- STORY_VIEWS
CREATE POLICY "story_views_select_policy" ON public.story_views
    FOR SELECT USING (true);

CREATE POLICY "story_views_insert_policy" ON public.story_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "story_views_update_policy" ON public.story_views
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "story_views_delete_policy" ON public.story_views
    FOR DELETE USING (true);

-- REPORTS
CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (true);

CREATE POLICY "reports_insert_policy" ON public.reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "reports_update_policy" ON public.reports
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "reports_delete_policy" ON public.reports
    FOR DELETE USING (true);

-- 9. VERIFICAÇÃO FINAL
SELECT 'RLS Status' as check_type, tablename, rowsecurity::text as enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'matches', 'story_views', 'reports')

UNION ALL

SELECT 'Policies Count' as check_type, tablename, count(*)::text as count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_settings', 'matches', 'story_views', 'reports')
GROUP BY tablename

ORDER BY check_type, tablename;