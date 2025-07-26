-- CORREÇÕES DE POLÍTICAS RLS
-- Execute este SQL no Supabase Dashboard

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