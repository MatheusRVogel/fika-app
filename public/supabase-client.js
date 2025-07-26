// Estado global do Supabase
window.fikahSupabaseReady = false;
window.fikahSupabase = null;
window.supabaseInitializationError = null;

// Função para aguardar o carregamento do Supabase
window.waitForSupabaseReady = function() {
    return new Promise((resolve, reject) => {
        // Se já está pronto, resolve imediatamente
        if (window.fikahSupabaseReady && window.fikahSupabase) {
            resolve(window.fikahSupabase);
            return;
        }

        // Se houve erro na inicialização, rejeita
        if (window.supabaseInitializationError) {
            reject(window.supabaseInitializationError);
            return;
        }

        // Aguarda o evento de inicialização
        const timeout = setTimeout(() => {
            reject(new Error('Timeout aguardando inicialização do Supabase'));
        }, 20000); // 20 segundos

        const handleReady = () => {
            clearTimeout(timeout);
            document.removeEventListener('supabaseReady', handleReady);
            document.removeEventListener('supabaseError', handleError);
            resolve(window.fikahSupabase);
        };

        const handleError = (event) => {
            clearTimeout(timeout);
            document.removeEventListener('supabaseReady', handleReady);
            document.removeEventListener('supabaseError', handleError);
            reject(event.detail || new Error('Erro na inicialização do Supabase'));
        };

        document.addEventListener('supabaseReady', handleReady);
        document.addEventListener('supabaseError', handleError);
    });
};

// Função para carregar script dinamicamente
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Função para aguardar que window.supabase esteja disponível
function waitForSupabase(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve(window.supabase);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkInterval);
                resolve(window.supabase);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error('Timeout aguardando window.supabase'));
            }
        }, 100);
    });
}

// Função principal de inicialização
async function initializeSupabase() {
    try {
        console.log('🚀 Iniciando inicialização do Supabase...');

        // Lista de CDNs para tentar
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js',
            'https://unpkg.com/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js',
            'https://cdn.skypack.dev/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js'
        ];

        // Se window.supabase não existe, tenta carregar dinamicamente
        if (!window.supabase) {
            console.log('⚠️ window.supabase não encontrado, tentando carregar dinamicamente...');
            
            let loaded = false;
            for (const url of cdnUrls) {
                try {
                    console.log(`📦 Tentando carregar: ${url}`);
                    await loadScript(url);
                    await waitForSupabase(5000);
                    loaded = true;
                    console.log(`✅ Supabase carregado com sucesso de: ${url}`);
                    break;
                } catch (error) {
                    console.warn(`❌ Falha ao carregar de ${url}:`, error);
                }
            }

            if (!loaded) {
                throw new Error('Não foi possível carregar o Supabase de nenhum CDN');
            }
        }

        // Aguarda window.supabase estar disponível
        await waitForSupabase();

        // Verifica se as configurações estão disponíveis
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            throw new Error('Configurações do Supabase não encontradas (SUPABASE_URL ou SUPABASE_ANON_KEY)');
        }

        console.log('🔧 Criando cliente Supabase...');

        // Cria o cliente Supabase
        const supabaseClient = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    flowType: 'pkce'
                }
            }
        );

        // Testa a conexão
        console.log('🔍 Testando conexão com Supabase...');
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error && error.message !== 'Auth session missing!') {
            console.warn('⚠️ Aviso na sessão:', error);
        }

        // Define as variáveis globais
        window.fikahSupabase = supabaseClient;
        window.supabase = window.supabase; // Mantém referência original
        window.fikahSupabaseReady = true;

        console.log('✅ Supabase inicializado com sucesso!');
        console.log('📊 Cliente:', supabaseClient);

        // Dispara evento de sucesso
        document.dispatchEvent(new CustomEvent('supabaseReady', {
            detail: supabaseClient
        }));

        return supabaseClient;

    } catch (error) {
        console.error('❌ Erro na inicialização do Supabase:', error);
        window.supabaseInitializationError = error;
        
        // Dispara evento de erro
        document.dispatchEvent(new CustomEvent('supabaseError', {
            detail: error
        }));
        
        throw error;
    }
}

// Classe SupabaseClient para compatibilidade
class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.ready = false;
    }

    async initializeClient() {
        try {
            this.supabase = await window.waitForSupabaseReady();
            this.ready = true;
            return this.supabase;
        } catch (error) {
            console.error('Erro ao inicializar cliente:', error);
            throw error;
        }
    }

    async signUp(email, password, userData = {}) {
        await this.ensureReady();
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        await this.ensureReady();
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }

    async signOut() {
        await this.ensureReady();
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async getCurrentUser() {
        await this.ensureReady();
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    async waitForSession(timeout = 10000) {
        await this.ensureReady();
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout aguardando sessão'));
            }, timeout);

            const checkSession = async () => {
                try {
                    const { data: { session }, error } = await this.supabase.auth.getSession();
                    if (error) throw error;
                    
                    if (session) {
                        clearTimeout(timeoutId);
                        resolve(session);
                    }
                } catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            };

            // Verifica imediatamente
            checkSession();

            // Escuta mudanças de autenticação
            const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();
                    resolve(session);
                }
            });
        });
    }

    async registerUser(userData) {
        await this.ensureReady();
        const { data, error } = await this.supabase
            .from('users')
            .insert([userData])
            .select();
        
        if (error) throw error;
        return data;
    }

    async ensureReady() {
        if (!this.ready) {
            await this.initializeClient();
        }
    }
}

// Inicialização automática
(function() {
    console.log('🎯 Iniciando inicialização automática do Supabase...');
    
    // Tenta inicializar imediatamente se window.supabase já existe
    if (window.supabase) {
        initializeSupabase().catch(error => {
            console.error('Erro na inicialização imediata:', error);
        });
    } else {
        // Aguarda um pouco e tenta novamente
        setTimeout(() => {
            initializeSupabase().catch(error => {
                console.error('Erro na inicialização com delay:', error);
            });
        }, 1000);
    }

    // Fallback: tenta inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.fikahSupabaseReady) {
                initializeSupabase().catch(error => {
                    console.error('Erro na inicialização no DOMContentLoaded:', error);
                });
            }
        });
    }
})();

// Exporta para compatibilidade
window.SupabaseClient = SupabaseClient;
window.initializeSupabase = initializeSupabase;