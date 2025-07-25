const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL e Key são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções para usuários
const userService = {
    // Registrar novo usuário
    async registerUser(userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
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
            const { data: profile, error: profileError } = await supabase
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

            if (profileError) throw profileError;

            return { user: data.user, profile };
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            throw error;
        }
    },

    // Login do usuário
    async loginUser(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            throw error;
        }
    },

    // Buscar perfil do usuário
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            throw error;
        }
    },

    // Atualizar perfil
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    },

    // Buscar usuários para explorar
    async getExploreUsers(userId, filters = {}) {
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', userId);

            // Aplicar filtros
            if (filters.minAge) {
                query = query.gte('age', filters.minAge);
            }
            if (filters.maxAge) {
                query = query.lte('age', filters.maxAge);
            }
            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }
};

// Funções para matches e likes
const matchService = {
    // Dar like em um usuário
    async likeUser(fromUserId, toUserId) {
        try {
            // Verificar se já existe like
            const { data: existingLike } = await supabase
                .from('likes')
                .select('*')
                .eq('from_user_id', fromUserId)
                .eq('to_user_id', toUserId)
                .single();

            if (existingLike) {
                return { message: 'Like já existe' };
            }

            // Criar like
            const { data: like, error } = await supabase
                .from('likes')
                .insert([
                    {
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            // Verificar se é um match (like mútuo)
            const { data: mutualLike } = await supabase
                .from('likes')
                .select('*')
                .eq('from_user_id', toUserId)
                .eq('to_user_id', fromUserId)
                .single();

            if (mutualLike) {
                // Criar match
                const { data: match, error: matchError } = await supabase
                    .from('matches')
                    .insert([
                        {
                            user1_id: fromUserId,
                            user2_id: toUserId,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (matchError) throw matchError;
                return { like, match, isMatch: true };
            }

            return { like, isMatch: false };
        } catch (error) {
            console.error('Erro ao dar like:', error);
            throw error;
        }
    },

    // Buscar matches do usuário
    async getUserMatches(userId) {
        try {
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    user1:profiles!matches_user1_id_fkey(*),
                    user2:profiles!matches_user2_id_fkey(*)
                `)
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar matches:', error);
            throw error;
        }
    }
};

// Funções para mensagens
const messageService = {
    // Enviar mensagem
    async sendMessage(fromUserId, toUserId, content) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        content,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    },

    // Buscar conversas do usuário
    async getUserConversations(userId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    from_user:profiles!messages_from_user_id_fkey(*),
                    to_user:profiles!messages_to_user_id_fkey(*)
                `)
                .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            throw error;
        }
    },

    // Buscar mensagens de uma conversa
    async getConversationMessages(userId, otherUserId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            throw error;
        }
    }
};

module.exports = {
    supabase,
    
    // Funções de usuário
    registerUser: userService.registerUser,
    loginUser: userService.loginUser,
    getUserProfile: userService.getUserProfile,
    updateUserProfile: userService.updateProfile,
    exploreUsers: userService.getExploreUsers,
    
    // Funções de match
    likeUser: matchService.likeUser,
    getMatches: matchService.getUserMatches,
    
    // Funções de mensagem
    sendMessage: messageService.sendMessage,
    getConversations: messageService.getUserConversations,
    getConversationMessages: messageService.getConversationMessages,
    
    // Serviços individuais para uso direto
    userService,
    matchService,
    messageService
};