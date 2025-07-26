const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO AVANÇADO DO SUPABASE');
console.log('=====================================');

async function diagnosticoAvancado() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        console.log('\n1️⃣ VERIFICANDO RLS NAS TABELAS...');
        
        // Verificar se RLS está habilitado
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('information_schema.tables')
            .select('table_name, row_security')
            .eq('table_schema', 'public')
            .in('table_name', ['profiles', 'user_settings', 'matches', 'story_views', 'reports']);
            
        if (rlsError) {
            console.log('❌ Erro ao verificar RLS:', rlsError.message);
        } else {
            console.log('✅ Status RLS das tabelas:');
            rlsStatus.forEach(table => {
                console.log(`   ${table.table_name}: RLS ${table.row_security ? 'HABILITADO' : 'DESABILITADO'}`);
            });
        }
        
        console.log('\n2️⃣ VERIFICANDO POLÍTICAS EXISTENTES...');
        
        // Tentar verificar políticas de forma alternativa
        const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
                FROM pg_policies 
                WHERE schemaname = 'public' 
                ORDER BY tablename, policyname;
            `
        });
        
        if (policiesError) {
            console.log('❌ Erro ao verificar políticas via RPC:', policiesError.message);
            
            // Tentar método direto
            console.log('\n3️⃣ TENTANDO VERIFICAÇÃO DIRETA...');
            const { data: directCheck, error: directError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('schemaname', 'public');
                
            if (directError) {
                console.log('❌ Erro na verificação direta:', directError.message);
                console.log('💡 POSSÍVEL CAUSA: Tabela pg_policies não acessível ou não existe');
            } else {
                console.log('✅ Políticas encontradas:', directCheck.length);
            }
        } else {
            console.log('✅ Políticas encontradas via RPC:', policies);
        }
        
        console.log('\n4️⃣ TESTANDO INSERÇÃO DIRETA...');
        
        // Tentar inserir diretamente com service role
        const testProfile = {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Teste RLS',
            age: 25,
            bio: 'Teste de política RLS',
            location: 'Teste',
            created_at: new Date().toISOString()
        };
        
        const { data: insertTest, error: insertError } = await supabase
            .from('profiles')
            .insert(testProfile)
            .select();
            
        if (insertError) {
            console.log('❌ Erro na inserção de teste:', insertError.message);
            console.log('💡 ISSO CONFIRMA: Políticas RLS estão bloqueando inserções');
        } else {
            console.log('✅ Inserção de teste bem-sucedida:', insertTest);
            
            // Limpar teste
            await supabase.from('profiles').delete().eq('id', testProfile.id);
        }
        
        console.log('\n5️⃣ VERIFICANDO CONFIGURAÇÃO DE AUTENTICAÇÃO...');
        
        const { data: authConfig, error: authError } = await supabase.auth.getSession();
        console.log('Auth session:', authConfig);
        
        console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
        console.log('========================');
        console.log('- URL:', supabaseUrl);
        console.log('- Chave usada:', supabaseKey ? 'SERVICE_ROLE' : 'ANON');
        console.log('- RLS Status: Verificado acima');
        console.log('- Políticas: Verificado acima');
        
    } catch (error) {
        console.log('❌ Erro geral:', error.message);
    }
}

diagnosticoAvancado();