// Login Script - Versão Simplificada e Robusta
console.log('🔐 Carregando login.js...');

// Aguardar que tudo esteja carregado
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM carregado, iniciando login...');
    
    try {
        // Aguardar Supabase estar pronto
        console.log('⏳ Aguardando Supabase...');
        
        // Aguardar função estar disponível
        let attempts = 0;
        while (!window.waitForSupabaseReady && attempts < 50) {
            console.log(`⏳ Aguardando waitForSupabaseReady (${attempts + 1}/50)...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.waitForSupabaseReady) {
            throw new Error('waitForSupabaseReady não está disponível');
        }
        
        console.log('✅ waitForSupabaseReady disponível');
        
        // Aguardar Supabase estar pronto
        const supabaseClient = await window.waitForSupabaseReady(15000);
        console.log('✅ Supabase pronto para login');
        
        // Configurar formulário de login
        setupLoginForm(supabaseClient);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar login:', error);
        showError('Erro ao carregar sistema de login. Recarregue a página.');
    }
});

function setupLoginForm(supabaseClient) {
    console.log('🔧 Configurando formulário de login...');
    
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const errorDiv = document.getElementById('error');
    
    if (!loginForm || !emailInput || !passwordInput || !loginButton) {
        console.error('❌ Elementos do formulário não encontrados');
        showError('Erro na interface de login');
        return;
    }
    
    console.log('✅ Elementos do formulário encontrados');
    
    // Remover loading
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    // Configurar evento de submit
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔐 Tentativa de login iniciada...');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }
        
        // Mostrar loading
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';
        hideError();
        
        try {
            console.log('🔑 Fazendo login com:', email);
            
            const { data, error } = await supabaseClient.client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Erro no login:', error);
                throw error;
            }
            
            console.log('✅ Login realizado com sucesso');
            console.log('👤 Usuário:', data.user?.email);
            
            // Aguardar um pouco para garantir que a sessão foi estabelecida
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirecionar para o app
            console.log('🔄 Redirecionando para o app...');
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            }
            
            showError(errorMessage);
            
        } finally {
            // Restaurar botão
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    });
    
    console.log('✅ Formulário de login configurado');
}

function showError(message) {
    console.error('🚨 Erro:', message);
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

console.log('✅ login.js carregado completamente');