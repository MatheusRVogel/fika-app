const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 TESTE COMPLETO DO SUPABASE');
console.log('================================');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? 'Configurada' : 'Não configurada'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('\n1️⃣ TESTANDO CONEXÃO...');
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
            console.log(`❌ Erro de conexão: ${error.message}`);
            return false;
        }
        console.log('✅ Conexão estabelecida');
        return true;
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
        return false;
    }
}

async function testTables() {
    console.log('\n2️⃣ VERIFICANDO TABELAS...');
    const tables = ['profiles', 'likes', 'matches', 'messages', 'stories', 'story_views', 'reports', 'user_settings'];
    let allTablesOk = true;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                allTablesOk = false;
            } else {
                console.log(`✅ ${table}: OK`);
            }
        } catch (error) {
            console.log(`❌ ${table}: ${error.message}`);
            allTablesOk = false;
        }
    }
    
    return allTablesOk;
}

async function testAuth() {
    console.log('\n3️⃣ TESTANDO AUTENTICAÇÃO...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.log(`❌ Erro na sessão: ${error.message}`);
        } else if (!session) {
            console.log('ℹ️ Nenhuma sessão ativa (normal)');
        } else {
            console.log('✅ Sessão ativa encontrada');
        }
        return true;
    } catch (error) {
        console.log(`❌ Erro na autenticação: ${error.message}`);
        return false;
    }
}

async function testUserCreation() {
    console.log('\n4️⃣ TESTANDO CRIAÇÃO DE USUÁRIO...');
    
    const testEmail = `teste${Date.now()}@fika.app`;
    const testPassword = 'teste123456';
    
    try {
        // 1. Criar usuário
        console.log(`📧 Criando usuário: ${testEmail}`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.log(`❌ Erro na criação: ${authError.message}`);
            return false;
        }
        
        console.log(`✅ Usuário criado! ID: ${authData.user.id}`);
        
        // 2. Tentar criar perfil
        console.log('📝 Testando criação de perfil...');
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name: 'Teste User',
                age: 25,
                location: 'São Paulo, SP',
                bio: 'Perfil de teste',
                interests: ['teste'],
                photos: []
            });
        
        if (profileError) {
            console.log(`❌ Erro no perfil: ${profileError.message}`);
            console.log('🔧 SOLUÇÃO: Execute o arquivo CORRECAO-RLS.md');
            return false;
        } else {
            console.log('✅ Perfil criado com sucesso!');
        }
        
        // 3. Tentar criar configurações
        console.log('⚙️ Testando criação de configurações...');
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .insert({
                user_id: authData.user.id,
                max_distance: 50,
                min_age: 18,
                max_age: 35
            });
        
        if (settingsError) {
            console.log(`❌ Erro nas configurações: ${settingsError.message}`);
            return false;
        } else {
            console.log('✅ Configurações criadas com sucesso!');
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Erro geral: ${error.message}`);
        return false;
    }
}

async function testRLSPolicies() {
    console.log('\n5️⃣ VERIFICANDO POLÍTICAS RLS...');
    
    try {
        const { data, error } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, cmd')
            .eq('schemaname', 'public')
            .order('tablename');
        
        if (error) {
            console.log(`❌ Erro ao verificar políticas: ${error.message}`);
            return false;
        }
        
        const policiesByTable = {};
        data.forEach(policy => {
            if (!policiesByTable[policy.tablename]) {
                policiesByTable[policy.tablename] = [];
            }
            policiesByTable[policy.tablename].push(`${policy.cmd}: ${policy.policyname}`);
        });
        
        console.log('📋 Políticas encontradas:');
        Object.keys(policiesByTable).forEach(table => {
            console.log(`\n  ${table}:`);
            policiesByTable[table].forEach(policy => {
                console.log(`    - ${policy}`);
            });
        });
        
        // Verificar políticas essenciais
        const essentialPolicies = [
            'profiles - INSERT',
            'user_settings - INSERT'
        ];
        
        let missingPolicies = [];
        essentialPolicies.forEach(essential => {
            const [table, cmd] = essential.split(' - ');
            const tablePolicies = policiesByTable[table] || [];
            const hasPolicy = tablePolicies.some(policy => policy.startsWith(cmd));
            if (!hasPolicy) {
                missingPolicies.push(essential);
            }
        });
        
        if (missingPolicies.length > 0) {
            console.log('\n❌ Políticas faltando:');
            missingPolicies.forEach(policy => console.log(`  - ${policy}`));
            console.log('\n🔧 Execute: CORRECAO-RLS.md');
            return false;
        } else {
            console.log('\n✅ Políticas essenciais encontradas');
            return true;
        }
        
    } catch (error) {
        console.log(`❌ Erro ao verificar políticas: ${error.message}`);
        return false;
    }
}

async function testAppIntegration() {
    console.log('\n6️⃣ TESTANDO INTEGRAÇÃO COM APP...');
    
    try {
        // Verificar se o supabase-client.js funciona
        console.log('📱 Verificando cliente do app...');
        
        // Simular operações do app
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(5);
        
        if (profilesError) {
            console.log(`❌ Erro ao buscar perfis: ${profilesError.message}`);
            return false;
        }
        
        console.log(`✅ Busca de perfis funcionando (${profiles.length} encontrados)`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ Erro na integração: ${error.message}`);
        return false;
    }
}

async function generateReport() {
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    
    const tests = [
        { name: 'Conexão', test: testConnection },
        { name: 'Tabelas', test: testTables },
        { name: 'Autenticação', test: testAuth },
        { name: 'Políticas RLS', test: testRLSPolicies },
        { name: 'Criação de Usuário', test: testUserCreation },
        { name: 'Integração App', test: testAppIntegration }
    ];
    
    const results = [];
    
    for (const { name, test } of tests) {
        try {
            const result = await test();
            results.push({ name, status: result ? '✅' : '❌', success: result });
        } catch (error) {
            results.push({ name, status: '❌', success: false, error: error.message });
        }
    }
    
    console.log('\n📋 RESUMO DOS TESTES:');
    results.forEach(({ name, status, error }) => {
        console.log(`${status} ${name}${error ? ` (${error})` : ''}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 RESULTADO: ${successCount}/${totalTests} testes passaram`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 SUPABASE ESTÁ FUNCIONANDO PERFEITAMENTE!');
        console.log('✅ Todos os sistemas operacionais');
        console.log('✅ Criação de usuários funcionando');
        console.log('✅ Integração com app completa');
    } else {
        console.log('\n⚠️ SUPABASE PRECISA DE CORREÇÕES');
        console.log('🔧 Siga as instruções em CORRECAO-RLS.md');
        console.log('📞 Execute este teste novamente após as correções');
    }
    
    console.log('\n🔗 Links úteis:');
    console.log('- Dashboard: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt');
    console.log('- SQL Editor: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
    console.log('- Configurações: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/settings/api');
}

// Executar todos os testes
generateReport().catch(console.error);