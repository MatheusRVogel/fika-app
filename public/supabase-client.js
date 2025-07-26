// Configuração do Supabase para o frontend
class SupabaseClient {
    constructor() {
        this.client = null;
        this.initializeClient();
    }

    async initializeClient() {
        try {
            // Aguardar o carregamento do Supabase CDN
            await this.waitForSupabase();
            
            // Configurações do Supabase
            const supabaseUrl = 'https://kujhzettkaitekulvhqt.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY3MjUsImV4cCI6MjA2OTA1MjcyNX0.etlkBCLU3g-6HC4CTbeX4s83bY4j1kIv4nE6Bt71iS8';

            // Inicializar cliente Supabase
            this.client = window.supabase.createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            
            // Adicionar referência global para compatibilidade
            this.supabase = this.client;
            
            console.log('✅ Cliente Supabase inicializado com sucesso');
            return this.client;
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            throw new Error('Falha ao conectar com o Supabase. Verifique sua conexão.');
        }
    }

    // Aguardar o carregamento do Supabase CDN
    async waitForSupabase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo
            
            const checkSupabase = () => {
                if (typeof window.supabase !== 'undefined') {
                    console.log('✅ Supabase CDN carregado');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Timeout: Supabase CDN não carregou'));
                } else {
                    attempts++;
                    setTimeout(checkSupabase, 100);
                }
            };
            
            checkSupabase();
        });
    }

    // Método para registrar usuário
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });
            return { data, error };
        } catch (error) {
            console.error('Erro no registro:', error);
            return { data: null, error };
        }
    }

    // Método para fazer login
    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email: email,
                password: password
            });
            return { data, error };
        } catch (error) {
            console.error('Erro no login:', error);
            return { data: null, error };
        }
    }

    // Método para fazer logout
    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            return { error };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { error };
        }
    }

    // Método para obter usuário atual
    async getCurrentUser() {
        try {
            // Primeiro, verificar se há uma sessão ativa
            const { data: { session }, error: sessionError } = await this.client.auth.getSession();
            
            if (sessionError) {
                console.error('Erro ao obter sessão:', sessionError);
                return { user: null, error: sessionError };
            }
            
            if (!session) {
                console.log('Nenhuma sessão ativa encontrada');
                return { user: null, error: null };
            }
            
            // Se há sessão, obter dados do usuário
            const { data: { user }, error } = await this.client.auth.getUser();
            
            if (error) {
                console.error('Erro ao obter usuário:', error);
                return { user: null, error };
            }
            
            console.log('✅ Usuário obtido com sucesso:', user?.email);
            return { user, error: null };
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return { user: null, error };
        }
    }

    // Método para aguardar sessão ser estabelecida
    async waitForSession(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const { data: { session } } = await this.client.auth.getSession();
                if (session) {
                    console.log('✅ Sessão encontrada na tentativa', i + 1);
                    return session;
                }
            } catch (error) {
                console.warn('Erro ao verificar sessão na tentativa', i + 1, ':', error);
            }
            
            // Aguardar 500ms antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('❌ Nenhuma sessão encontrada após', maxAttempts, 'tentativas');
        return null;
    }

    // Registrar novo usuário
    async registerUser(userData) {
        try {
            // Registrar usuário no Supabase Auth com confirmação de email
            const { data: authData, error: authError } = await this.client.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name
                    },
                    emailRedirectTo: `${window.location.origin}/login?confirmed=true`
                }
            });

            if (authError) throw authError;

            // Se o usuário foi criado mas precisa confirmar email
            if (authData.user && !authData.user.email_confirmed_at) {
                return { 
                    user: authData.user, 
                    needsEmailConfirmation: true,
                    message: 'Cadastro realizado! Verifique seu email para confirmar a conta.'
                };
            }

            // Se o email já foi confirmado, criar perfil
            if (authData.user && authData.user.email_confirmed_at) {
                const { data: profileData, error: profileError } = await this.client
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        email: userData.email,
                        name: userData.name,
                        age: userData.age,
                        location: userData.location,
                        latitude: userData.latitude || null,
                        longitude: userData.longitude || null,
                        birthdate: userData.birthdate,
                        bio: userData.bio || '',
                        interests: userData.interests || [],
                        relationship_types: userData.relationshipTypes || [],
                        looking_for: userData.lookingFor || [],
                        gender_preferences: userData.genderPreferences || [],
                        age_confirmed: userData.ageConfirmed || false,
                        photos: userData.photos || []
                    }])
                    .select()
                    .single();

                if (profileError) {
                    console.warn('Erro ao criar perfil, mas usuário foi registrado:', profileError);
                }

                return { 
                    user: authData.user, 
                    profile: profileData,
                    needsEmailConfirmation: false
                };
            }

            return { 
                user: authData.user, 
                needsEmailConfirmation: true,
                message: 'Cadastro realizado! Verifique seu email para confirmar a conta.'
            };
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            
            // Melhorar mensagens de erro
            if (error.message.includes('User already registered')) {
                throw new Error('Este email já está cadastrado. Tente fazer login ou recuperar sua senha.');
            } else if (error.message.includes('Password should be at least')) {
                throw new Error('A senha deve ter pelo menos 6 caracteres.');
            } else if (error.message.includes('Invalid email')) {
                throw new Error('Por favor, insira um email válido.');
            } else if (error.message.includes('signup is disabled')) {
                throw new Error('Cadastro temporariamente desabilitado. Tente novamente mais tarde.');
            }
            
            throw error;
        }
    }

    // Login do usuário
    async loginUser(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            throw error;
        }
    }

    // Criar perfil do usuário após confirmação de email
    async createUserProfile(userData) {
        try {
            const { data: profileData, error: profileError } = await this.client
                .from('profiles')
                .insert([{
                    id: userData.userId,
                    email: userData.email,
                    name: userData.name,
                    age: userData.age,
                    location: userData.location,
                    latitude: userData.latitude || null,
                    longitude: userData.longitude || null,
                    birthdate: userData.birthdate,
                    bio: userData.bio || '',
                    interests: userData.interests || [],
                    relationship_types: userData.relationshipTypes || [],
                    looking_for: userData.lookingFor || [],
                    gender_preferences: userData.genderPreferences || [],
                    age_confirmed: userData.ageConfirmed || false,
                    photos: userData.photos || []
                }])
                .select()
                .single();

            if (profileError) throw profileError;
            return profileData;
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
            throw error;
        }
    }

    // Verificar se o usuário tem perfil criado
    async checkUserProfile(userId) {
        try {
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erro ao verificar perfil:', error);
            return null;
        }
    }

    // Logout do usuário
    async logoutUser() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            throw error;
        }
    }

    // Buscar perfil do usuário
    async getUserProfile(userId) {
        try {
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return null;
        }
    }

    // Atualizar localização do usuário
    async updateUserLocation(userId, latitude, longitude, location) {
        try {
            const { data, error } = await this.client
                .from('profiles')
                .update({
                    latitude: latitude,
                    longitude: longitude,
                    location: location,
                    location_updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            throw error;
        }
    }

    // Buscar usuários próximos
    async getNearbyUsers(userId, latitude, longitude, maxDistance = 50) {
        try {
            const { data, error } = await this.client
                .rpc('get_nearby_users', {
                    user_lat: latitude,
                    user_lon: longitude,
                    max_distance_km: maxDistance,
                    exclude_user_id: userId
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar usuários próximos:', error);
            return [];
        }
    }
}

// Aguardar o carregamento do DOM e do Supabase antes de inicializar
async function initializeSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            console.log('🔄 Inicializando cliente Supabase...');
            window.fikahSupabase = new SupabaseClient();
            
            // Aguardar a inicialização completa
            await window.fikahSupabase.initializeClient();
            
            // Marcar como inicializado
            window.fikahSupabaseReady = true;
            console.log('✅ Cliente Supabase pronto para uso');
            
            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('supabaseReady'));
        } else {
            console.log('⏳ Aguardando carregamento do Supabase CDN...');
            setTimeout(initializeSupabase, 100);
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        setTimeout(initializeSupabase, 1000); // Tentar novamente em 1 segundo
    }
}

// Função para aguardar o Supabase estar pronto
window.waitForSupabaseReady = function(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (window.fikahSupabaseReady && window.fikahSupabase) {
            resolve(window.fikahSupabase);
            return;
        }
        
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout: Supabase não inicializou a tempo'));
        }, timeout);
        
        window.addEventListener('supabaseReady', () => {
            clearTimeout(timeoutId);
            resolve(window.fikahSupabase);
        }, { once: true });
    });
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}