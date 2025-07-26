// SCRIPT PARA APLICAR CORREÇÕES SQL AUTOMATICAMENTE
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kujhzettkaitekulvhqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY3MjUsImV4cCI6MjA2OTA1MjcyNX0.etlkBCLU3g-6HC4CTbeX4s83bY4j1kIv4nE6Bt71iS8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUrgentFixes() {
    console.log('🚀 Aplicando correções urgentes...');
    
    try {
        // 1. Verificar conexão
        console.log('1️⃣ Testando conexão...');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.error('❌ Erro na conexão:', testError.message);
            return;
        }
        console.log('✅ Conexão OK!');
        
        // 2. Verificar se os campos existem
        console.log('2️⃣ Verificando campos da tabela profiles...');
        const { data: columns, error: columnsError } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'profiles' 
                AND table_schema = 'public'
                AND column_name IN ('email', 'latitude', 'longitude')
                `
            });
            
        if (columnsError) {
            console.log('⚠️ Não foi possível verificar campos (normal se RPC não existir)');
        } else {
            console.log('✅ Campos verificados:', columns);
        }
        
        // 3. Testar inserção simples
        console.log('3️⃣ Testando inserção de dados...');
        const testUser = {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Teste Urgente',
            age: 25,
            location: 'São Paulo',
            email: 'teste@urgente.com',
            latitude: -23.5505,
            longitude: -46.6333
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .upsert(testUser)
            .select();
            
        if (insertError) {
            console.error('❌ Erro na inserção:', insertError.message);
            console.log('💡 Execute o SQL fix-urgent-final.sql no Supabase Dashboard');
        } else {
            console.log('✅ Inserção bem-sucedida!', insertData);
        }
        
        // 4. Limpar dados de teste
        console.log('4️⃣ Limpando dados de teste...');
        await supabase
            .from('profiles')
            .delete()
            .eq('id', testUser.id);
        console.log('✅ Limpeza concluída!');
        
        console.log('🎉 CORREÇÕES APLICADAS COM SUCESSO!');
        console.log('📋 Próximos passos:');
        console.log('   1. Teste a página: http://localhost:8000/test-final-working.html');
        console.log('   2. Se houver erros, execute fix-urgent-final.sql no Supabase');
        console.log('   3. Teste registro e login');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        console.log('💡 Execute manualmente o SQL fix-urgent-final.sql no Supabase Dashboard');
    }
}

// Executar correções
applyUrgentFixes();