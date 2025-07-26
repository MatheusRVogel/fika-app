const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 CONFIGURANDO FUNÇÃO exec_sql NO SUPABASE');
console.log('===========================================');

const supabase = createClient(supabaseUrl, supabaseKey);

async function createExecSqlFunction() {
    console.log('\n1️⃣ Criando função exec_sql...');
    
    try {
        // Ler o arquivo da função
        const functionSQL = fs.readFileSync('create-exec-sql-function.sql', 'utf8');
        
        // Tentar criar a função usando uma abordagem alternativa
        console.log('📝 Tentando criar função via RPC...');
        
        // Como não temos exec_sql ainda, vamos usar uma abordagem diferente
        // Vamos tentar usar o endpoint de SQL direto (se disponível)
        
        console.log('⚠️ A função exec_sql precisa ser criada manualmente.');
        console.log('📋 Copie e cole este SQL no Supabase Dashboard:');
        console.log('🔗 https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
        console.log('\n' + '='.repeat(50));
        console.log(functionSQL);
        console.log('='.repeat(50));
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao criar função:', error.message);
        return false;
    }
}

async function testExecSqlFunction() {
    console.log('\n2️⃣ Testando função exec_sql...');
    
    try {
        // Testar se a função existe
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: 'SELECT 1 as test'
        });
        
        if (error) {
            console.log(`❌ Função não encontrada: ${error.message}`);
            console.log('💡 Execute primeiro o SQL acima no Dashboard');
            return false;
        }
        
        console.log('✅ Função exec_sql funcionando!');
        console.log('📊 Resultado:', data);
        return true;
        
    } catch (error) {
        console.log(`❌ Erro no teste: ${error.message}`);
        return false;
    }
}

async function autoFixRLS() {
    console.log('\n3️⃣ Aplicando correções RLS automaticamente...');
    
    try {
        // Ler as correções
        const fixSQL = fs.readFileSync('fix-rls-policies.sql', 'utf8');
        const commands = fixSQL.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
        
        console.log(`📋 Executando ${commands.length} comandos...`);
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (command) {
                console.log(`\n${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: command
                });
                
                if (error) {
                    console.log(`   ❌ Erro: ${error.message}`);
                } else if (data && data.success) {
                    console.log(`   ✅ Sucesso`);
                } else if (data && !data.success) {
                    console.log(`   ⚠️ Aviso: ${data.error}`);
                } else {
                    console.log(`   ✅ Executado`);
                }
            }
        }
        
        console.log('\n🎉 Correções aplicadas automaticamente!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro nas correções:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando configuração automática...\n');
    
    // Passo 1: Tentar criar a função
    const functionCreated = await createExecSqlFunction();
    
    if (!functionCreated) {
        console.log('\n⏸️ PAUSADO - Execute o SQL manualmente primeiro');
        console.log('📞 Depois execute: node setup-auto-sql.js');
        return;
    }
    
    // Passo 2: Testar a função
    const functionWorks = await testExecSqlFunction();
    
    if (!functionWorks) {
        console.log('\n❌ Função não está funcionando');
        return;
    }
    
    // Passo 3: Aplicar correções automaticamente
    const fixesApplied = await autoFixRLS();
    
    if (fixesApplied) {
        console.log('\n🎉 CONFIGURAÇÃO COMPLETA!');
        console.log('✅ Função exec_sql criada');
        console.log('✅ Correções RLS aplicadas');
        console.log('🧪 Execute: node test-supabase-complete.js');
    }
}

main().catch(console.error);