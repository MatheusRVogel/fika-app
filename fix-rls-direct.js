const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kujhzettkaitekulvhqt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    console.log('🔧 Para aplicar correções RLS automaticamente, você precisa:');
    console.log('1. Obter a Service Role Key no Supabase Dashboard');
    console.log('2. Adicionar SUPABASE_SERVICE_ROLE_KEY=sua_chave no arquivo .env');
    console.log('');
    console.log('🔗 Ou execute manualmente no Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql');
    console.log('');
    console.log('📋 SQL para executar:');
    console.log('');
    console.log(`-- Adicionar política para permitir inserção de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Adicionar política para permitir inserção de configurações de usuário
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adicionar política para permitir criação de matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- Adicionar política para permitir visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Adicionar política para permitir denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);`);
    
    process.exit(1);
}

// Cliente com Service Role Key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
    console.log('🔧 CORRIGINDO POLÍTICAS RLS');
    console.log('============================');
    
    const policies = [
        {
            name: 'Usuários podem criar próprio perfil',
            table: 'profiles',
            sql: `CREATE POLICY "Usuários podem criar próprio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`
        },
        {
            name: 'Usuários podem criar próprias configurações',
            table: 'user_settings',
            sql: `CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'Sistema pode criar matches',
            table: 'matches',
            sql: `CREATE POLICY "Sistema pode criar matches" ON matches FOR INSERT WITH CHECK (true);`
        },
        {
            name: 'Usuários podem visualizar stories',
            table: 'story_views',
            sql: `CREATE POLICY "Usuários podem visualizar stories" ON story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);`
        },
        {
            name: 'Usuários podem fazer denúncias',
            table: 'reports',
            sql: `CREATE POLICY "Usuários podem fazer denúncias" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);`
        }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const policy of policies) {
        try {
            console.log(`📝 Criando política: ${policy.name}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: policy.sql
            });
            
            if (error) {
                if (error.message.includes('already exists')) {
                    console.log(`ℹ️ Política já existe: ${policy.name}`);
                    successCount++;
                } else {
                    console.log(`❌ Erro: ${error.message}`);
                    errorCount++;
                }
            } else {
                console.log(`✅ Política criada: ${policy.name}`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ Erro ao criar política ${policy.name}: ${err.message}`);
            errorCount++;
        }
    }
    
    console.log('');
    console.log('📊 RESULTADO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    if (errorCount === 0) {
        console.log('');
        console.log('🎉 TODAS AS POLÍTICAS RLS FORAM CORRIGIDAS!');
        console.log('🧪 Execute o teste completo: node test-supabase-complete.js');
    } else {
        console.log('');
        console.log('⚠️ Algumas políticas falharam. Execute manualmente no Dashboard.');
    }
}

// Executar correções
fixRLSPolicies().catch(console.error);