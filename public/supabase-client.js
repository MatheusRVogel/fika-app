// Supabase Client - Versão Ultra Simplificada e Robusta
console.log('🚀 Carregando supabase-client.js...');

// Estado global
window.fikahSupabase = null;
window.supabaseReady = false;

// Função principal para aguardar Supabase - DEFINIDA IMEDIATAMENTE
window.waitForSupabaseReady = async function(timeout = 15000) {
    console.log('⏳ waitForSupabaseReady chamada');
    
    // Se já está pronto, retornar imediatamente
    if (window.supabaseReady && window.fikahSupabase) {
        console.log('✅ Supabase já pronto');
        return window.fikahSupabase;
    }
    
    // Tentar inicializar
    try {
        await initializeSupabaseNow();
        return window.fikahSupabase;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        throw error;
    }
};

// Função para inicializar Supabase AGORA
async function initializeSupabaseNow() {
    console.log('🔧 Inicializando Supabase agora...');
    
    // Verificar configurações
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        throw new Error('Configurações do Supabase não encontradas');
    }
    
    // Verificar biblioteca
    if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Biblioteca Supabase não carregada');
    }
    
    console.log('✅ Configurações e biblioteca OK');
    
    // Criar cliente
    const client = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    );
    
    console.log('✅ Cliente Supabase criado');
    
    // Criar wrapper simples
    window.fikahSupabase = {
        client: client,
        initialized: true,
        
        // Login simples
        async signIn(email, password) {
            const { data, error } = await client.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
        
        // Logout simples
        async signOut() {
            const { error } = await client.auth.signOut();
            if (error) throw error;
        },
        
        // Obter usuário
        async getUser() {
            const { data, error } = await client.auth.getUser();
            if (error) throw error;
            return data.user;
        },
        
        // Obter sessão
        async getSession() {
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            return data.session;
        }
    };
    
    window.supabaseReady = true;
    console.log('✅ Supabase inicializado com sucesso!');
    
    return window.fikahSupabase;
}

// Tentar inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado, tentando inicializar Supabase...');
    
    // Aguardar um pouco para garantir que todos os scripts carregaram
    setTimeout(async () => {
        try {
            await initializeSupabaseNow();
        } catch (error) {
            console.error('❌ Erro na inicialização automática:', error);
            console.log('⚠️ Supabase será inicializado quando solicitado');
        }
    }, 1000);
});

console.log('✅ supabase-client.js carregado');