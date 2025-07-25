// Configuração do Supabase para o frontend
class SupabaseClient {
    constructor() {
        // Aguardar carregamento das configurações
        this.initializeClient();
    }

    async initializeClient() {
        try {
            // Aguardar configurações
            await new Promise(resolve => {
                if (window.SUPABASE_CONFIG) {
                    resolve();
                } else {
                    setTimeout(resolve, 100);
                }
            });

            // Usar configurações do arquivo de config ou fallback
            const config = window.SUPABASE_CONFIG || {
                url: 'https://your-project.supabase.co',
                anonKey: 'your-anon-key'
            };

            this.supabaseUrl = config.url;
            this.supabaseKey = config.anonKey;
            
            // Carregar a biblioteca do Supabase via CDN se não estiver disponível
            if (!window.supabase) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Verificar se as configurações são válidas
            if (this.supabaseUrl.includes('your-project') || this.supabaseKey.includes('your-anon-key')) {
                console.warn('⚠️ Supabase não configurado. Usando localStorage como fallback.');
                this.client = null;
            } else {
                // Criar cliente do Supabase
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, config.options);
                console.log('✅ Supabase conectado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
            // Fallback para localStorage se Supabase não estiver disponível
            this.client = null;
        }
    }

    // Registrar novo usuário
    async registerUser(userData) {
        try {
            if (!this.client) {
                // Fallback para localStorage
                return this.registerUserLocal(userData);
            }

            const { data, error } = await this.client.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name,
                        age: userData.age,
                        location: userData.location
                    }
                }
            });

            if (error) throw error;

            // Criar perfil do usuário
            const { data: profile, error: profileError } = await this.client
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        name: userData.name,
                        age: userData.age,
                        location: userData.location,
                        bio: userData.bio || '',
                        interests: userData.interests || [],
                        photos: userData.photos || [],
                        is_premium: false,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.warn('Erro ao criar perfil:', profileError);
            }

            return { user: data.user, profile };
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            throw error;
        }
    }

    // Login do usuário
    async loginUser(email, password) {
        try {
            if (!this.client) {
                // Fallback para localStorage
                return this.loginUserLocal(email, password);
            }

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

    // Logout do usuário
    async logoutUser() {
        try {
            if (this.client) {
                await this.client.auth.signOut();
            }
            
            // Limpar localStorage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            
            return true;
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            throw error;
        }
    }

    // Verificar se usuário está logado
    async getCurrentUser() {
        try {
            if (!this.client) {
                // Fallback para localStorage
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    return {
                        user: {
                            email: localStorage.getItem('userEmail'),
                            user_metadata: {
                                name: localStorage.getItem('userName')
                            }
                        }
                    };
                }
                return null;
            }

            const { data: { user } } = await this.client.auth.getUser();
            return user ? { user } : null;
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            return null;
        }
    }

    // Fallback para localStorage quando Supabase não está disponível
    registerUserLocal(userData) {
        const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
        
        // Verificar se email já existe
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email já cadastrado');
        }

        const newUser = {
            id: Date.now().toString(),
            email: userData.email,
            name: userData.name,
            age: userData.age,
            location: userData.location,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('fika_users', JSON.stringify(users));

        return { user: newUser };
    }

    loginUserLocal(email, password) {
        const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return { user };
    }

    // Buscar perfil do usuário
    async getUserProfile(userId) {
        try {
            if (!this.client) {
                return null;
            }

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
}

// Instância global do cliente Supabase
window.fikaSupabase = new SupabaseClient();