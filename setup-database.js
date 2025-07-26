const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Configurando banco de dados Supabase...');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configurações do Supabase não encontradas no arquivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
    console.log('\n📋 Criando tabelas no Supabase...');
    
    try {
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'supabase-schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Arquivo SQL carregado com sucesso');
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`🔨 Executando ${commands.length} comandos SQL...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            if (command.trim().length === 0) continue;
            
            try {
                console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                
                // Para comandos DDL, usamos rpc
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: command + ';' 
                });
                
                if (error) {
                    // Alguns erros são esperados (como tabela já existe)
                    if (error.message.includes('already exists') || 
                        error.message.includes('does not exist') ||
                        error.message.includes('permission denied')) {
                        console.log(`⚠️ Aviso: ${error.message}`);
                    } else {
                        console.log(`❌ Erro: ${error.message}`);
                        errorCount++;
                    }
                } else {
                    successCount++;
                    console.log(`✅ Comando executado com sucesso`);
                }
                
            } catch (err) {
                console.log(`❌ Erro ao executar comando: ${err.message}`);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Resumo:`);
        console.log(`✅ Sucessos: ${successCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        
        return errorCount === 0;
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error.message);
        return false;
    }
}

async function createTablesManually() {
    console.log('\n🔨 Criando tabelas manualmente...');
    
    try {
        // Criar tabela profiles
        console.log('1. Criando tabela profiles...');
        const { error: profilesError } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS profiles (
                    id UUID REFERENCES auth.users(id) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
                    location VARCHAR(200),
                    bio TEXT,
                    interests TEXT[],
                    photos TEXT[],
                    is_premium BOOLEAN DEFAULT FALSE,
                    premium_started_at TIMESTAMP WITH TIME ZONE,
                    stripe_customer_id VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });
        
        if (profilesError) {
            console.log('❌ Erro ao criar tabela profiles:', profilesError.message);
        } else {
            console.log('✅ Tabela profiles criada');
        }
        
        // Criar tabela likes
        console.log('2. Criando tabela likes...');
        const { error: likesError } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS likes (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(from_user_id, to_user_id)
                );
            `
        });
        
        if (likesError) {
            console.log('❌ Erro ao criar tabela likes:', likesError.message);
        } else {
            console.log('✅ Tabela likes criada');
        }
        
        // Criar tabela matches
        console.log('3. Criando tabela matches...');
        const { error: matchesError } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS matches (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user1_id, user2_id)
                );
            `
        });
        
        if (matchesError) {
            console.log('❌ Erro ao criar tabela matches:', matchesError.message);
        } else {
            console.log('✅ Tabela matches criada');
        }
        
        // Criar tabela messages
        console.log('4. Criando tabela messages...');
        const { error: messagesError } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });
        
        if (messagesError) {
            console.log('❌ Erro ao criar tabela messages:', messagesError.message);
        } else {
            console.log('✅ Tabela messages criada');
        }
        
        console.log('\n✅ Tabelas principais criadas com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas manualmente:', error.message);
        return false;
    }
}

async function testTablesAfterCreation() {
    console.log('\n🧪 Testando tabelas após criação...');
    
    const tables = ['profiles', 'likes', 'matches', 'messages'];
    let allOk = true;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                allOk = false;
            } else {
                console.log(`✅ ${table}: OK`);
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
            allOk = false;
        }
    }
    
    return allOk;
}

async function main() {
    console.log('🚀 Iniciando configuração do banco de dados Fika...\n');
    
    // Tentar criar tabelas manualmente (mais confiável)
    const tablesCreated = await createTablesManually();
    
    if (tablesCreated) {
        // Testar se as tabelas foram criadas corretamente
        const tablesOk = await testTablesAfterCreation();
        
        if (tablesOk) {
            console.log('\n🎉 Banco de dados configurado com sucesso!');
            console.log('✅ Todas as tabelas foram criadas e estão funcionando');
            console.log('\n📱 Agora você pode usar o aplicativo Fika normalmente!');
        } else {
            console.log('\n⚠️ Algumas tabelas podem ter problemas');
        }
    } else {
        console.log('\n❌ Falha ao criar tabelas');
        console.log('\n📋 Solução alternativa:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
        console.log('2. Cole o conteúdo do arquivo supabase-schema.sql');
        console.log('3. Execute o script SQL manualmente');
    }
    
    console.log('\n🔗 Links úteis:');
    console.log('- Dashboard: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt');
    console.log('- SQL Editor: https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
}

main().catch(console.error);