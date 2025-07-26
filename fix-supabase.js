const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔧 Corrigindo políticas RLS do Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseServiceKey ? 'Configurada' : 'Não configurada'}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
    try {
        console.log('\n📋 Aplicando correções nas políticas RLS...');
        
        // Ler o arquivo de correções
        const fixSQL = fs.readFileSync('fix-rls-policies.sql', 'utf8');
        
        // Dividir em comandos individuais
        const commands = fixSQL.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (command) {
                console.log(`\n${i + 1}. Executando comando...`);
                console.log(`   ${command.substring(0, 50)}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: command
                });
                
                if (error) {
                    console.log(`   ❌ Erro: ${error.message}`);
                    // Continuar mesmo com erros (política pode já existir)
                } else {
                    console.log(`   ✅ Sucesso`);
                }
            }
        }
        
        console.log('\n🎉 Correções aplicadas!');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar correções:', error.message);
        console.log('\n📝 Execute manualmente no SQL Editor do Supabase:');
        console.log('https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
        console.log('\nCopie e cole o conteúdo do arquivo fix-rls-policies.sql');
    }
}

async function testUserCreation() {
    console.log('\n👤 Testando criação de usuário após correções...');
    
    try {
        // Criar usuário de teste
        const testEmail = `teste${Date.now()}@fika.app`;
        const testPassword = 'teste123456';
        
        console.log(`📧 Criando usuário: ${testEmail}`);
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.log(`❌ Erro na autenticação: ${authError.message}`);
            return;
        }
        
        console.log(`✅ Usuário criado com sucesso!`);
        console.log(`🆔 ID: ${authData.user.id}`);
        
        // Tentar criar perfil
        console.log('\n📝 Criando perfil...');
        
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                name: 'Usuário Teste',
                age: 25,
                location: 'São Paulo, SP',
                bio: 'Perfil de teste',
                interests: ['música', 'cinema'],
                photos: []
            });
        
        if (profileError) {
            console.log(`❌ Erro ao criar perfil: ${profileError.message}`);
        } else {
            console.log(`✅ Perfil criado com sucesso!`);
        }
        
        // Tentar criar configurações
        console.log('\n⚙️ Criando configurações...');
        
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .insert({
                user_id: authData.user.id,
                max_distance: 50,
                min_age: 18,
                max_age: 35,
                show_me: 'everyone'
            });
        
        if (settingsError) {
            console.log(`❌ Erro ao criar configurações: ${settingsError.message}`);
        } else {
            console.log(`✅ Configurações criadas com sucesso!`);
        }
        
        console.log('\n🎉 Teste de criação de usuário concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

async function main() {
    await fixRLSPolicies();
    await testUserCreation();
}

main();