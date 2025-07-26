// Configuração do Supabase para o frontend
class SupabaseClient {
    constructor() {
        this.useLocalStorage = false;
        
        // Tentar inicializar Supabase real
        try {
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                this.client = window.supabase.createClient(
                    'https://kujhzettkaitekulvhqt.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY3MjUsImV4cCI6MjA2OTA1MjcyNX0.etlkBCLU3g-6HC4CTbeX4s83bY4j1kIv4nE6Bt71iS8'
                );
                console.log('✅ Supabase Client inicializado com banco real');
            } else {
                throw new Error('Supabase não disponível');
            }
        } catch (error) {
            console.warn('⚠️ Supabase não disponível, usando localStorage como fallback');
            this.useLocalStorage = true;
        }
    }

    // Método para registrar usuário
    async signUp(email, password, userData = {}) {
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            const userId = 'user_' + Date.now();
            const user = {
                id: userId,
                email: email,
                user_metadata: userData
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            return { data: { user }, error: null };
        }
        
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
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            const user = {
                id: 'user_' + Date.now(),
                email: email
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            return { data: { user }, error: null };
        }
        
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
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            return { error: null };
        }
        
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
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            const userStr = localStorage.getItem('currentUser');
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (userStr && isLoggedIn) {
                return { user: JSON.parse(userStr), error: null };
            }
            return { user: null, error: null };
        }
        
        try {
            const { data: { user }, error } = await this.client.auth.getUser();
            return { user, error };
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return { user: null, error };
        }
    }

    // Registrar novo usuário
    async registerUser(userData) {
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            try {
                // Verificar se email já existe
                const existingUsers = JSON.parse(localStorage.getItem('fikah_users') || '[]');
                const emailExists = existingUsers.find(u => u.email === userData.email);
                
                if (emailExists) {
                    throw new Error('Email já cadastrado');
                }
                
                // Criar novo usuário
                const userId = 'user_' + Date.now();
                const newUser = {
                    id: userId,
                    email: userData.email,
                    password: userData.password, // Em produção, isso seria hasheado
                    user_metadata: {
                        name: userData.name,
                        age: userData.age,
                        location: userData.location,
                        birthdate: userData.birthdate,
                        interests: userData.interests || [],
                        relationshipTypes: userData.relationshipTypes || [],
                        lookingFor: userData.lookingFor || [],
                        genderPreferences: userData.genderPreferences || [],
                        ageConfirmed: userData.ageConfirmed || false
                    },
                    created_at: new Date().toISOString()
                };
                
                // Salvar usuário
                existingUsers.push(newUser);
                localStorage.setItem('fikah_users', JSON.stringify(existingUsers));
                
                // Fazer login automático
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                localStorage.setItem('isLoggedIn', 'true');
                
                return { user: newUser, profile: newUser.user_metadata };
            } catch (error) {
                console.error('Erro no registro localStorage:', error);
                throw error;
            }
        }
        
        try {
            // Registrar usuário no Supabase Auth
            const { data: authData, error: authError } = await this.client.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name
                    }
                }
            });

            if (authError) throw authError;

            // Criar perfil do usuário
            const { data: profileData, error: profileError } = await this.client
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    name: userData.name,
                    age: userData.age,
                    location: userData.location,
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

            return { user: authData.user, profile: profileData };
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            throw error;
        }
    }

    // Login do usuário
    async loginUser(email, password) {
        if (this.useLocalStorage) {
            // Fallback usando localStorage
            try {
                const existingUsers = JSON.parse(localStorage.getItem('fikah_users') || '[]');
                const user = existingUsers.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    throw new Error('Invalid login credentials');
                }
                
                // Fazer login
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('isLoggedIn', 'true');
                
                return { user: user };
            } catch (error) {
                console.error('Erro no login localStorage:', error);
                throw error;
            }
        }
        
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
}

// Aguardar o carregamento do DOM e do Supabase antes de inicializar
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        window.fikahSupabase = new SupabaseClient();
    } else {
        console.log('Aguardando carregamento do Supabase...');
        setTimeout(initializeSupabase, 100);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}