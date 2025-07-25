// Configuração do Supabase para o frontend
class SupabaseClient {
    constructor() {
        // Usar sempre o mock local para desenvolvimento
        this.client = null;
        console.log('✅ Supabase Client inicializado em modo local');
    }

    // Registrar novo usuário
    async registerUser(userData) {
        try {
            // Usar sempre localStorage para desenvolvimento local
            return this.registerUserLocal(userData);
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            throw error;
        }
    }

    // Login do usuário
    async loginUser(email, password) {
        try {
            // Usar sempre localStorage para desenvolvimento local
            return this.loginUserLocal(email, password);
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            throw error;
        }
    }

    // Logout do usuário
    async logoutUser() {
        try {
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
            // Usar localStorage
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
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            return null;
        }
    }

    // Implementação local usando localStorage
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
            bio: userData.bio || '',
            interests: userData.interests || [],
            photos: userData.photos || [],
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('fika_users', JSON.stringify(users));

        // Salvar dados do usuário logado
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', newUser.email);
        localStorage.setItem('userName', newUser.name);
        localStorage.setItem('userId', newUser.id);

        return { user: newUser };
    }

    loginUserLocal(email, password) {
        const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Salvar dados do usuário logado
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userId', user.id);

        return { user };
    }

    // Buscar perfil do usuário
    async getUserProfile(userId) {
        try {
            const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
            const user = users.find(u => u.id === userId);
            return user || null;
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return null;
        }
    }
}

// Instância global do cliente Supabase
window.fikaSupabase = new SupabaseClient();