const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseService {
  // Autenticação
  async registerUser(email, password, profile) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profile
        }
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async loginUser(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Perfil do usuário
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
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, profile: data };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Explorar usuários
  async exploreUsers(userId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao explorar usuários:', error);
      throw error;
    }
  }

  // Likes e matches
  async likeUser(userId, likedUserId) {
    try {
      // Inserir like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ user_id: userId, liked_user_id: likedUserId });

      if (likeError) throw likeError;

      // Verificar se é um match (like mútuo)
      const { data: mutualLike, error: mutualError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', likedUserId)
        .eq('liked_user_id', userId)
        .single();

      if (mutualError && mutualError.code !== 'PGRST116') {
        throw mutualError;
      }

      const isMatch = !!mutualLike;

      if (isMatch) {
        // Criar match
        const { error: matchError } = await supabase
          .from('matches')
          .insert({ user1_id: userId, user2_id: likedUserId });

        if (matchError) throw matchError;
      }

      return { success: true, isMatch };
    } catch (error) {
      console.error('Erro ao curtir usuário:', error);
      throw error;
    }
  }

  async getMatches(userId) {
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

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar matches:', error);
      throw error;
    }
  }

  // Mensagens
  async sendMessage(senderId, receiverId, content, type = 'text') {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          type
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: data };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      throw error;
    }
  }

  async getMessages(userId, otherUserId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();