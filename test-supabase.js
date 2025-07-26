const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Verificando configuração do Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configurações do Supabase não encontradas no arquivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
    console.log('\n🧪 Testando conexão com Supabase...');
    
    try {
        // Teste 1: Verificar conexão básica
        console.log('1. Testando conexão básica...');
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.log('❌ Erro na conexão:', error.message);
            
            // Se a tabela não existe, vamos tentar criar
            if (error.message.includes('relation "profiles" does not exist')) {
                console.log('\n📋 Tabela "profiles" não existe. Isso é normal se for a primeira execução.');
                console.log('💡 Você precisa executar o script SQL no Supabase Dashboard.');
                console.log('📁 O script está no arquivo: supabase-schema.sql');
                console.log('🔗 Acesse: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
                return false;
            }
            
            throw error;
        }
        
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Teste 2: Verificar tabelas existentes
        console.log('\n2. Verificando tabelas...');
        const tables = ['profiles', 'likes', 'matches', 'messages', 'stories', 'story_views', 'reports', 'user_settings'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('*').limit(1);
                if (error) {
                    console.log(`❌ ${table}: ${error.message}`);
                } else {
                    console.log(`✅ ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ ${table}: ${err.message}`);
            }
        }
        
        // Teste 3: Verificar autenticação
        console.log('\n3. Testando sistema de autenticação...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError && authError.message !== 'Invalid JWT') {
            console.log('❌ Erro na autenticação:', authError.message);
        } else {
            console.log('✅ Sistema de autenticação funcionando');
            if (user) {
                console.log(`👤 Usuário logado: ${user.email}`);
            } else {
                console.log('👤 Nenhum usuário logado (normal)');
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        return false;
    }
}

async function createTestUser() {
    console.log('\n👤 Testando criação de usuário...');
    
    try {
        const testEmail = `teste${Date.now()}@fika.app`;
        const testPassword = 'teste123456';
        
        // Tentar registrar usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    name: 'Usuário Teste'
                }
            }
        });
        
        if (authError) {
            console.log('❌ Erro ao criar usuário:', authError.message);
            return false;
        }
        
        console.log('✅ Usuário criado com sucesso!');
        console.log('📧 Email:', testEmail);
        console.log('🆔 ID:', authData.user?.id);
        
        // Tentar criar perfil
        if (authData.user) {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    name: 'Usuário Teste',
                    age: 25,
                    location: 'São Paulo, SP',
                    bio: 'Perfil de teste criado automaticamente',
                    interests: ['tecnologia', 'música'],
                    photos: []
                }])
                .select();
            
            if (profileError) {
                console.log('❌ Erro ao criar perfil:', profileError.message);
                return false;
            }
            
            console.log('✅ Perfil criado com sucesso!');
            
            // Limpar usuário de teste
            await supabase.from('profiles').delete().eq('id', authData.user.id);
            console.log('🧹 Perfil de teste removido');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste de usuário:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando verificação do Supabase para o Fika...\n');
    
    const connectionOk = await testSupabaseConnection();
    
    if (connectionOk) {
        console.log('\n🎉 Supabase está funcionando corretamente!');
        
        // Testar criação de usuário apenas se as tabelas existem
        const userTestOk = await createTestUser();
        
        if (userTestOk) {
            console.log('\n✅ Todos os testes passaram! O Supabase está pronto para uso.');
        } else {
            console.log('\n⚠️ Conexão OK, mas há problemas com criação de usuários.');
        }
    } else {
        console.log('\n❌ Há problemas com a configuração do Supabase.');
        console.log('\n📋 Próximos passos:');
        console.log('1. Verifique se o projeto Supabase está ativo');
        console.log('2. Execute o script SQL (supabase-schema.sql) no Dashboard');
        console.log('3. Verifique as configurações no arquivo .env');
    }
    
    console.log('\n🔗 Links úteis:');
    console.log('- Dashboard: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt');
    console.log('- SQL Editor: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
    console.log('- Configurações: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/settings/api');
}

main().catch(console.error);