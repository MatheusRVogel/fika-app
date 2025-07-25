// FIKAH - JavaScript Limpo e Funcional

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('FIKAH App iniciado');
    
    // Inicializar navegação
    initNavigation();
    
    // Inicializar funcionalidades dos posts
    initPosts();
    
    // Inicializar stories
    initStories();
    
    // Mostrar tela inicial
    showScreen('home');
});

// Sistema de Navegação
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const screenName = this.getAttribute('data-screen');
            if (screenName) {
                showScreen(screenName);
                updateActiveNav(this);
            }
        });
    });
}

function showScreen(screenName) {
    // Esconder todas as telas
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela selecionada
    const targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log(`Tela ${screenName} ativada`);
    } else {
        console.error(`Tela ${screenName} não encontrada`);
    }
}

function updateActiveNav(activeButton) {
    // Remover classe active de todos os botões
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Adicionar classe active ao botão clicado
    activeButton.classList.add('active');
}

// Funcionalidades dos Posts
function initPosts() {
    // Botões de curtir
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            toggleLike(this);
        });
    });
    
    // Botões de comentar
    const commentButtons = document.querySelectorAll('.comment-btn');
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            showComments(this);
        });
    });
    
    // Botões de compartilhar
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            sharePost(this);
        });
    });
    
    // Formulários de comentário
    const commentForms = document.querySelectorAll('.add-comment');
    commentForms.forEach(form => {
        const input = form.querySelector('input');
        const button = form.querySelector('button');
        
        if (input && button) {
            button.addEventListener('click', function() {
                addComment(input, this);
            });
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addComment(input, button);
                }
            });
        }
    });
}

function toggleLike(button) {
    const isLiked = button.classList.contains('liked');
    const post = button.closest('.modern-post');
    const likesElement = post.querySelector('.post-likes');
    
    if (isLiked) {
        button.classList.remove('liked');
        button.innerHTML = '<i class="fa fa-heart"></i>';
        updateLikesCount(likesElement, -1);
    } else {
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        updateLikesCount(likesElement, 1);
    }
}

function updateLikesCount(element, change) {
    if (!element) return;
    
    const currentText = element.textContent;
    const currentCount = parseInt(currentText.match(/\d+/)[0]);
    const newCount = currentCount + change;
    
    element.textContent = `${newCount} curtidas`;
}

function showComments(button) {
    showNotification('Comentários em breve!');
}

function sharePost(button) {
    showNotification('Compartilhamento em breve!');
}

function addComment(input, button) {
    const text = input.value.trim();
    if (text) {
        showNotification('Comentário adicionado!');
        input.value = '';
    }
}

// Funcionalidades dos Stories
function initStories() {
    const storyItems = document.querySelectorAll('.story-item');
    storyItems.forEach(item => {
        item.addEventListener('click', function() {
            const username = this.querySelector('.story-username').textContent;
            showNotification(`Visualizando story de ${username}`);
        });
    });
}

// Sistema de Notificações
function showNotification(message) {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Mostrar com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Funcionalidades do Header
function initHeader() {
    // Botão de distância
    const distanceBtn = document.querySelector('.distance-btn');
    if (distanceBtn) {
        distanceBtn.addEventListener('click', function() {
            showNotification('Seletor de distância em breve!');
        });
    }
    
    // Botão de notificações
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            showNotification('Notificações em breve!');
        });
    }
    
    // Botão de filtros
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            showNotification('Filtros em breve!');
        });
    }
    
    // Avatar do perfil
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar) {
        profileAvatar.addEventListener('click', function() {
            showNotification('Perfil em breve!');
        });
    }
}

// Funcionalidades da tela Explorar
function initExplore() {
    const exploreCards = document.querySelectorAll('.explore-card');
    exploreCards.forEach(card => {
        card.addEventListener('click', function() {
            const name = this.querySelector('h4').textContent;
            showNotification(`Visualizando perfil de ${name}`);
        });
    });
}

// Funcionalidades da tela Mensagens
function initMessages() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.chat-name').textContent;
            showNotification(`Abrindo conversa com ${name}`);
        });
    });
}

// Inicializar todas as funcionalidades quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initExplore();
    initMessages();
});

// Função para debug
function debugApp() {
    console.log('=== DEBUG FIKAH APP ===');
    console.log('Telas disponíveis:', document.querySelectorAll('.screen').length);
    console.log('Tela ativa:', document.querySelector('.screen.active')?.id || 'Nenhuma');
    console.log('Botões de navegação:', document.querySelectorAll('.nav-btn').length);
    console.log('Posts:', document.querySelectorAll('.modern-post').length);
    console.log('Stories:', document.querySelectorAll('.story-item').length);
}

// Expor função de debug globalmente
window.debugApp = debugApp;