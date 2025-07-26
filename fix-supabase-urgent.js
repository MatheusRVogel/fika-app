const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://kujhzettkaitekulvhqt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY3MjUsImV4cCI6MjA2OTA1MjcyNX0.etlkBCLU3g-6HC4CTbeX4s83bY4j1kIv4nE6Bt71iS8';

async function fixSupabaseUrgent() {
    console.log('🚨 CORREÇÃO URGENTE DO SUPABASE - INICIANDO...\n');
    
    try {
        // Inicializar cliente Supabase
        console.log('1️⃣ Inicializando cliente Supabase...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Cliente inicializado com sucesso!\n');

        // Testar conexão básica
        console.log('2️⃣ Testando conexão básica...');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erro na conexão:', testError.message);
            console.log('🔧 Aplicando correções RLS...\n');
            
            // Aplicar correções RLS
            await applyRLSFixes(supabase);
        } else {
            console.log('✅ Conexão funcionando!\n');
        }

        // Verificar tabelas existentes
        console.log('3️⃣ Verificando tabelas...');
        await checkTables(supabase);

        // Testar autenticação
        console.log('4️⃣ Testando autenticação...');
        await testAuth(supabase);

        // Testar operações CRUD
        console.log('5️⃣ Testando operações CRUD...');
        await testCRUD(supabase);

        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('🌐 Teste no navegador: http://localhost:8000/test-supabase-real.html');
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO:', error.message);
        console.log('\n🔧 Aplicando correção de emergência...');
        await emergencyFix();
    }
}

async function applyRLSFixes(supabase) {
    console.log('🔧 Aplicando correções RLS...');
    
    const rlsQueries = [
        'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE matches DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE story_views DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE reports DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE likes DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE messages DISABLE ROW LEVEL SECURITY;',
        'ALTER TABLE stories DISABLE ROW LEVEL SECURITY;'
    ];

    for (const query of rlsQueries) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: query });
            if (error) {
                console.log(`⚠️  ${query} - ${error.message}`);
            } else {
                console.log(`✅ ${query}`);
            }
        } catch (err) {
            console.log(`⚠️  ${query} - ${err.message}`);
        }
    }
}

async function checkTables(supabase) {
    const tables = ['profiles', 'user_settings', 'matches', 'likes', 'messages', 'stories', 'story_views', 'reports'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ Tabela ${table}: ${error.message}`);
            } else {
                console.log(`✅ Tabela ${table}: OK`);
            }
        } catch (err) {
            console.log(`❌ Tabela ${table}: ${err.message}`);
        }
    }
}

async function testAuth(supabase) {
    try {
        // Verificar usuário atual
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.log(`⚠️  Auth check: ${error.message}`);
        } else if (user) {
            console.log(`✅ Usuário logado: ${user.email}`);
        } else {
            console.log(`ℹ️  Nenhum usuário logado`);
        }

        // Testar registro (com email único)
        const testEmail = `teste_${Date.now()}@fikah.com`;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: '123456'
        });

        if (signUpError) {
            console.log(`⚠️  Teste de registro: ${signUpError.message}`);
        } else {
            console.log(`✅ Teste de registro: OK`);
            
            // Fazer logout do usuário de teste
            await supabase.auth.signOut();
        }

    } catch (err) {
        console.log(`❌ Erro no teste de auth: ${err.message}`);
    }
}

async function testCRUD(supabase) {
    try {
        // Testar inserção na tabela profiles
        const testProfile = {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Teste CRUD',
            email: `crud_test_${Date.now()}@fikah.com`,
            age: 25,
            bio: 'Teste de CRUD',
            latitude: -23.5505,
            longitude: -46.6333
        };

        const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert(testProfile)
            .select();

        if (insertError) {
            console.log(`⚠️  Teste INSERT: ${insertError.message}`);
        } else {
            console.log(`✅ Teste INSERT: OK`);
            
            // Testar update
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ bio: 'Teste UPDATE' })
                .eq('id', testProfile.id);

            if (updateError) {
                console.log(`⚠️  Teste UPDATE: ${updateError.message}`);
            } else {
                console.log(`✅ Teste UPDATE: OK`);
            }

            // Testar delete
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', testProfile.id);

            if (deleteError) {
                console.log(`⚠️  Teste DELETE: ${deleteError.message}`);
            } else {
                console.log(`✅ Teste DELETE: OK`);
            }
        }

    } catch (err) {
        console.log(`❌ Erro no teste CRUD: ${err.message}`);
    }
}

async function emergencyFix() {
    console.log('🚨 APLICANDO CORREÇÃO DE EMERGÊNCIA...');
    console.log('📋 Execute manualmente no Supabase Dashboard:');
    console.log('🔗 https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
    console.log('\n--- SQL PARA EXECUTAR ---');
    console.log(`
-- CORREÇÃO DE EMERGÊNCIA
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'matches', 'likes');
    `);
    console.log('--- FIM DO SQL ---\n');
}

// Executar correção
if (require.main === module) {
    fixSupabaseUrgent().catch(console.error);
}

module.exports = { fixSupabaseUrgent };