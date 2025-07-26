-- Script para corrigir políticas RLS que estão impedindo criação de usuários

-- Adicionar política para permitir inserção de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Adicionar política para permitir inserção de configurações de usuário
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adicionar política para permitir criação de matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- Adicionar política para permitir visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Adicionar política para permitir denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;