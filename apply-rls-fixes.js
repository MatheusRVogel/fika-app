const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kujhzettkaitekulvhqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0OTY4NzQsImV4cCI6MjA1MTA3Mjg3NH0.Ej8Ej_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFixes() {
    console.log('🔧 APLICANDO CORREÇÕES RLS');
    console.log('==========================');
    console.log('');
    
    console.log('📋 INSTRUÇÕES PARA CORREÇÃO MANUAL:');
    console.log('');
    console.log('1. Acesse o Supabase Dashboard:');
    console.log('🔗 https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
    console.log('');
    console.log('2. Cole e execute o seguinte SQL:');
    console.log('');
    console.log('-- ========================================');
    console.log('-- CORREÇÕES DE POLÍTICAS RLS');
    console.log('-- ========================================');
    console.log('');
    
    const sqlCommands = [
        `-- 1. Política para criação de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);`,
        
        `-- 2. Política para configurações de usuário
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        
        `-- 3. Política para matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);`,
        
        `-- 4. Política para visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);`,
        
        `-- 5. Política para denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);`
    ];
    
    sqlCommands.forEach((sql, index) => {
        console.log(sql);
        console.log('');
    });
    
    console.log('-- ========================================');
    console.log('-- VERIFICAÇÃO (opcional)');
    console.log('-- ========================================');
    console.log('');
    console.log(`-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;`);
    
    console.log('');
    console.log('3. Após executar o SQL, teste novamente:');
    console.log('📞 node test-supabase-complete.js');
    console.log('');
    
    // Tentar verificar se conseguimos acessar as tabelas
    console.log('🔍 VERIFICANDO ACESSO ATUAL...');
    
    try {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (profilesError) {
            console.log('❌ Erro ao acessar profiles:', profilesError.message);
        } else {
            console.log('✅ Acesso à tabela profiles: OK');
        }
    } catch (err) {
        console.log('❌ Erro de conexão:', err.message);
    }
    
    try {
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('count')
            .limit(1);
            
        if (settingsError) {
            console.log('❌ Erro ao acessar user_settings:', settingsError.message);
        } else {
            console.log('✅ Acesso à tabela user_settings: OK');
        }
    } catch (err) {
        console.log('❌ Erro ao verificar user_settings:', err.message);
    }
    
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('As políticas RLS precisam ser criadas manualmente no Dashboard');
    console.log('para permitir que usuários criem perfis e configurações.');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL no Dashboard');
    console.log('2. Rode: node test-supabase-complete.js');
    console.log('3. Teste o registro de usuário na aplicação');
}

applyRLSFixes().catch(console.error);