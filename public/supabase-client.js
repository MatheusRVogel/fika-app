// Estado global do Supabase
window.fikahSupabaseReady = false;
window.fikahSupabase = null;
window.supabaseInitializationError = null;

// Função para aguardar o carregamento do Supabase - DEFINIDA IMEDIATAMENTE
window.waitForSupabaseReady = function(timeout = 15000) {
    console.log('⏳ waitForSupabaseReady chamada, timeout:', timeout);
    
    return new Promise((resolve, reject) => {
        // Se já está pronto, resolver imediatamente
        if (window.fikahSupabase && window.fikahSupabase.initialized) {
            console.log('✅ Supabase já inicializado, resolvendo imediatamente');
            resolve(window.fikahSupabase);
            return;
        }
        
        let attempts = 0;
        const maxAttempts = timeout / 100; // Verificar a cada 100ms
        
        const checkInterval = setInterval(() => {
            attempts++;
            console.log(`🔍 Verificando Supabase (tentativa ${attempts}/${maxAttempts})...`);
            
            if (window.fikahSupabase && window.fikahSupabase.initialized) {
                console.log('✅ Supabase pronto!');
                clearInterval(checkInterval);
                resolve(window.fikahSupabase);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ Timeout aguardando Supabase');
                clearInterval(checkInterval);
                reject(new Error('Timeout aguardando Supabase estar pronto'));
                return;
            }
        }, 100);
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

// Função para inicializar Supabase
async function initializeSupabase() {
    console.log('🚀 Iniciando inicialização do Supabase...');
    
    try {
        // Verificar se as configurações estão disponíveis
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            console.error('❌ Configurações do Supabase não encontradas');
            console.log('SUPABASE_URL:', window.SUPABASE_URL);
            console.log('SUPABASE_ANON_KEY:', window.SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
            throw new Error('Configurações do Supabase não encontradas');
        }
        
        console.log('✅ Configurações encontradas');
        console.log('URL:', window.SUPABASE_URL);
        console.log('Key:', window.SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
        
        // Verificar se o Supabase está carregado
        if (!window.supabase || !window.supabase.createClient) {
            console.error('❌ Biblioteca Supabase não carregada');
            throw new Error('Biblioteca Supabase não carregada');
        }
        
        console.log('✅ Biblioteca Supabase carregada');
        
        // Criar cliente Supabase
        const supabaseClient = window.supabase.createClient(
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
        
        // Criar wrapper com métodos úteis
        window.fikahSupabase = {
            client: supabaseClient,
            initialized: true,
            
            // Método para aguardar sessão
            async waitForSession(timeout = 10000) {
                console.log('⏳ Aguardando sessão...');
                
                return new Promise((resolve) => {
                    let attempts = 0;
                    const maxAttempts = timeout / 100;
                    
                    const checkSession = async () => {
                        attempts++;
                        
                        try {
                            const { data: { session }, error } = await supabaseClient.auth.getSession();
                            
                            if (session) {
                                console.log('✅ Sessão encontrada');
                                resolve(session);
                                return;
                            }
                            
                            if (attempts >= maxAttempts) {
                                console.log('⏰ Timeout aguardando sessão');
                                resolve(null);
                                return;
                            }
                            
                            setTimeout(checkSession, 100);
                        } catch (error) {
                            console.error('❌ Erro ao verificar sessão:', error);
                            if (attempts >= maxAttempts) {
                                resolve(null);
                                return;
                            }
                            setTimeout(checkSession, 100);
                        }
                    };
                    
                    checkSession();
                });
            },
            
            // Método para obter usuário atual
            async getCurrentUser() {
                try {
                    const { data, error } = await supabaseClient.auth.getUser();
                    if (error) throw error;
                    return data;
                } catch (error) {
                    console.error('❌ Erro ao obter usuário:', error);
                    return null;
                }
            },
            
            // Método para login
            async signIn(email, password) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) throw error;
                    return data;
                } catch (error) {
                    console.error('❌ Erro no login:', error);
                    throw error;
                }
            },
            
            // Método para logout
            async signOut() {
                try {
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) throw error;
                    return true;
                } catch (error) {
                    console.error('❌ Erro no logout:', error);
                    throw error;
                }
            }
        };
        
        console.log('✅ Supabase inicializado com sucesso!');
        return window.fikahSupabase;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        window.fikahSupabase = {
            initialized: false,
            error: error.message
        };
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

// Tentar inicializar imediatamente se as configurações estão disponíveis
if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
    console.log('🚀 Configurações disponíveis, inicializando imediatamente...');
    initializeSupabase().catch(error => {
        console.error('❌ Erro na inicialização imediata:', error);
    });
} else {
    console.log('⏳ Aguardando configurações e biblioteca...');
    
    // Aguardar DOM e tentar novamente
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM carregado, tentando inicializar...');
        
        // Aguardar um pouco para garantir que todos os scripts carregaram
        setTimeout(() => {
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
                console.log('🚀 Inicializando após DOM...');
                initializeSupabase().catch(error => {
                    console.error('❌ Erro na inicialização após DOM:', error);
                });
            } else {
                console.error('❌ Configurações ainda não disponíveis após DOM');
                console.log('SUPABASE_URL:', window.SUPABASE_URL);
                console.log('SUPABASE_ANON_KEY:', window.SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
                console.log('supabase:', window.supabase ? 'Carregado' : 'Não carregado');
            }
        }, 500);
    });
}

// Expor função de inicialização para uso manual
window.initializeSupabase = initializeSupabase;
window.SupabaseClient = SupabaseClient;