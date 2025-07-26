// Configuração do Supabase
const SUPABASE_CONFIG = {
    // Configuração real do Supabase
    url: 'https://kujhzettkaitekulvhqt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1amh6ZXR0a2FpdGVrdWx2aHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY3MjUsImV4cCI6MjA2OTA1MjcyNX0.etlkBCLU3g-6HC4CTbeX4s83bY4j1kIv4nE6Bt71iS8',
    
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

console.log('✅ Supabase configurado com banco real:', SUPABASE_CONFIG.url);

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