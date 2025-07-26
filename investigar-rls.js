const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 INVESTIGAÇÃO DETALHADA RLS');
console.log('============================');

async function investigarRLS() {
    if (!supabaseServiceKey) {
        console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!');
        console.log('💡 Isso pode ser o problema principal!');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('✅ Service Role Key encontrada');
    console.log('🔑 Chave:', supabaseServiceKey.substring(0, 20) + '...');
    
    try {
        console.log('\n1️⃣ TESTANDO INSERÇÃO DIRETA COM SERVICE ROLE...');
        
        // Tentar inserir diretamente com service role
        const testProfile = {
            id: '99999999-9999-9999-9999-999999999999',
            name: 'Teste Service Role',
            age: 25,
            bio: 'Teste com service role',
            location: 'Teste',
            created_at: new Date().toISOString()
        };
        
        const { data: insertResult, error: insertError } = await supabase
            .from('profiles')
            .insert(testProfile)
            .select();
            
        if (insertError) {
            console.log('❌ Erro na inserção com SERVICE ROLE:', insertError.message);
            console.log('💡 Isso indica que RLS está bloqueando até mesmo o SERVICE ROLE!');
        } else {
            console.log('✅ Inserção com SERVICE ROLE funcionou!');
            console.log('📝 Dados inseridos:', insertResult);
            
            // Limpar teste
            await supabase.from('profiles').delete().eq('id', testProfile.id);
            console.log('🧹 Dados de teste removidos');
        }
        
        console.log('\n2️⃣ VERIFICANDO CONFIGURAÇÃO DE AUTENTICAÇÃO...');
        
        // Verificar configuração de auth
        const { data: user, error: userError } = await supabase.auth.getUser();
        console.log('👤 Usuário atual:', user);
        console.log('❌ Erro de usuário:', userError);
        
        console.log('\n3️⃣ TESTANDO BYPASS RLS...');
        
        // Tentar com bypass RLS (só funciona com service role)
        const { data: bypassResult, error: bypassError } = await supabase
            .from('profiles')
            .insert({
                id: '88888888-8888-8888-8888-888888888888',
                name: 'Teste Bypass RLS',
                age: 30,
                bio: 'Teste bypass',
                location: 'Teste'
            })
            .select();
            
        if (bypassError) {
            console.log('❌ Erro no bypass RLS:', bypassError.message);
        } else {
            console.log('✅ Bypass RLS funcionou!');
            await supabase.from('profiles').delete().eq('id', '88888888-8888-8888-8888-888888888888');
        }
        
        console.log('\n4️⃣ VERIFICANDO PERMISSÕES DA CHAVE...');
        
        // Verificar se a chave tem permissões adequadas
        const { data: tablesInfo, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(5);
            
        if (tablesError) {
            console.log('❌ Erro ao acessar information_schema:', tablesError.message);
            console.log('💡 A chave pode não ter permissões suficientes');
        } else {
            console.log('✅ Acesso ao information_schema OK');
        }
        
    } catch (error) {
        console.log('❌ Erro geral na investigação:', error.message);
    }
}

investigarRLS();