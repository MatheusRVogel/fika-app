-- CORREÇÕES DE POLÍTICAS RLS (Idempotente)
-- Execute este SQL no Supabase Dashboard

-- Função auxiliar para remover políticas se existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem criar próprio perfil' AND tablename = 'profiles') THEN
        DROP POLICY "Usuários podem criar próprio perfil" ON profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem criar próprias configurações' AND tablename = 'user_settings') THEN
        DROP POLICY "Usuários podem criar próprias configurações" ON user_settings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sistema pode criar matches' AND tablename = 'matches') THEN
        DROP POLICY "Sistema pode criar matches" ON matches;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem visualizar stories' AND tablename = 'story_views') THEN
        DROP POLICY "Usuários podem visualizar stories" ON story_views;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem fazer denúncias' AND tablename = 'reports') THEN
        DROP POLICY "Usuários podem fazer denúncias" ON reports;
    END IF;
END
$$;

-- 1. Política para criação de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Política para configurações de usuário
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Política para matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- 4. Política para visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 5. Política para denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);