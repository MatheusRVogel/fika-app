// Login.js - Versão Ultra Simplificada e Funcional
console.log('🚀 Carregando login.js...');

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM carregado, inicializando login...');
    
    try {
        // Aguardar Supabase estar pronto
        console.log('⏳ Aguardando Supabase...');
        const supabase = await window.waitForSupabaseReady(10000);
        console.log('✅ Supabase pronto!');
        
        // Configurar formulários
        setupLoginForm(supabase);
        setupTabs();
        
        console.log('✅ Login inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar login:', error);
        showError('Erro ao carregar sistema de login. Recarregue a página.');
    }
});

// Configurar formulário de login
function setupLoginForm(supabase) {
    console.log('🔧 Configurando formulário de login...');
    
    const loginForm = document.querySelector('#loginForm form');
    const loginButton = document.getElementById('loginButton');
    
    if (!loginForm) {
        console.error('❌ Formulário de login não encontrado');
        return;
    }
    
    if (!loginButton) {
        console.error('❌ Botão de login não encontrado');
        return;
    }
    
    // Evento de submit do formulário
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔐 Tentativa de login...');
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            showError('Por favor, preencha email e senha');
            return;
        }
        
        // Desabilitar botão
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';
        
        try {
            // Fazer login
            const result = await supabase.signIn(email, password);
            console.log('✅ Login realizado:', result);
            
            showSuccess('Login realizado com sucesso!');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            showError('Email ou senha incorretos');
            
            // Reabilitar botão
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    });
    
    console.log('✅ Formulário de login configurado');
}

// Configurar troca de abas
function setupTabs() {
    console.log('🔧 Configurando abas...');
    
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab) {
        loginTab.addEventListener('click', () => switchTab('login'));
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', () => switchTab('register'));
    }
    
    console.log('✅ Abas configuradas');
}

// Trocar aba
function switchTab(tab) {
    console.log('🔄 Trocando para aba:', tab);
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (tab === 'login') {
        // Mostrar login
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
    } else {
        // Mostrar registro
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
    }
    
    // Limpar mensagens
    clearMessages();
}

// Mostrar erro
function showError(message) {
    console.error('❌ Erro:', message);
    
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
    }
    
    // Esconder após 5 segundos
    setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
}

// Mostrar sucesso
function showSuccess(message) {
    console.log('✅ Sucesso:', message);
    
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = 'green';
        errorDiv.style.marginTop = '10px';
    }
}

// Limpar mensagens
function clearMessages() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

console.log('✅ login.js carregado');