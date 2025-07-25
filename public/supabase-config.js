// Configuração do Supabase
// Para desenvolvimento local, usando configuração mock

const SUPABASE_CONFIG = {
    // Configuração mock para desenvolvimento local
    url: 'https://mock-project.supabase.co',
    anonKey: 'mock-anon-key-for-development',
    
    // Configurações opcionais
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// Exportar configuração para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Mock do Supabase para desenvolvimento local
window.supabase = {
    auth: {
        signUp: async (credentials) => {
            // Simular cadastro bem-sucedido
            const user = {
                id: 'user_' + Date.now(),
                email: credentials.email,
                user_metadata: credentials.options?.data || {}
            };
            
            // Salvar no localStorage para persistência
            const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
            
            // Verificar se email já existe
            if (users.find(u => u.email === credentials.email)) {
                throw new Error('User already registered');
            }
            
            users.push(user);
            localStorage.setItem('fika_users', JSON.stringify(users));
            
            return { data: { user }, error: null };
        },
        
        signInWithPassword: async (credentials) => {
            // Simular login
            const users = JSON.parse(localStorage.getItem('fika_users') || '[]');
            const user = users.find(u => u.email === credentials.email);
            
            if (!user) {
                throw new Error('Invalid login credentials');
            }
            
            return { data: { user }, error: null };
        },
        
        signOut: async () => {
            return { error: null };
        },
        
        getUser: async () => {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                return { data: { user: JSON.parse(currentUser) }, error: null };
            }
            return { data: { user: null }, error: null };
        }
    },
    
    from: (table) => ({
        insert: async (data) => ({ data, error: null }),
        select: async () => ({ data: [], error: null }),
        update: async (data) => ({ data, error: null }),
        delete: async () => ({ data: null, error: null })
    })
};

console.log('Supabase mock configurado para desenvolvimento local');

// Instruções para configuração:
/*
1. Acesse https://supabase.com e crie um novo projeto
2. Vá para Settings > API
3. Copie a "Project URL" e substitua em 'url' acima
4. Copie a "anon public" key e substitua em 'anonKey' acima
5. Execute o script SQL abaixo no SQL Editor do Supabase para criar as tabelas:

-- Criar tabela de perfis
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    location TEXT NOT NULL,
    bio TEXT DEFAULT '',
    interests TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de likes
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES profiles(id) NOT NULL,
    to_user_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Criar tabela de matches
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES profiles(id) NOT NULL,
    user2_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Criar tabela de mensagens
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES profiles(id) NOT NULL,
    to_user_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profiles
CREATE POLICY "Usuários podem ver perfis públicos" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de segurança para likes
CREATE POLICY "Usuários podem ver próprios likes" ON likes
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Usuários podem dar likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Políticas de segurança para matches
CREATE POLICY "Usuários podem ver próprios matches" ON matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Políticas de segurança para messages
CREATE POLICY "Usuários podem ver próprias mensagens" ON messages
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Usuários podem enviar mensagens" ON messages
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

6. Salve este arquivo e recarregue a página
*/