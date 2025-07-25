// JavaScript Updated - 2024-12-23-FINAL
let currentScreen = 'home';
let currentUser = 'Maria Silva';

// Dados de exemplo para explorar
const exploreUsers = [
    {
        id: 1,
        name: 'Ana',
        age: 25,
        location: 'São Paulo, SP',
        distance: '2 km',
        image: 'placeholder.svg',
        liked: false
    },
    {
        id: 2,
        name: 'Carlos',
        age: 28,
        location: 'Rio de Janeiro, RJ',
        distance: '5 km',
        image: 'placeholder.svg',
        liked: false
    },
    {
        id: 3,
        name: 'Beatriz',
        age: 23,
        location: 'Belo Horizonte, MG',
        distance: '3 km',
        image: 'placeholder.svg',
        liked: false
    },
    {
        id: 4,
        name: 'Diego',
        age: 30,
        location: 'Salvador, BA',
        distance: '7 km',
        image: 'placeholder.svg',
        liked: false
    }
];

// Dados de exemplo para mensagens
const chatData = [
    {
        id: 1,
        name: 'Ana Silva',
        lastMessage: 'Oi! Como você está?',
        time: '2 min',
        avatar: 'placeholder.svg'
    },
    {
        id: 2,
        name: 'Carlos Santos',
        lastMessage: 'Vamos nos encontrar hoje?',
        time: '15 min',
        avatar: 'placeholder.svg'
    },
    {
        id: 3,
        name: 'Beatriz Costa',
        lastMessage: 'Adorei seu último post!',
        time: '1h',
        avatar: 'placeholder.svg'
    }
];

// Função para mostrar notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Função para criar animação de coração
function createHeartAnimation(element) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'absolute';
    heart.style.fontSize = '30px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '1000';
    heart.style.left = '50%';
    heart.style.top = '50%';
    heart.style.transform = 'translate(-50%, -50%)';
    heart.style.animation = 'heartPop 0.6s ease-out';
    
    element.style.position = 'relative';
    element.appendChild(heart);
    
    setTimeout(() => {
        if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
        }
    }, 600);
}

// Função para popular a página de explorar
function populateExploreScreen() {
    const exploreGrid = document.querySelector('.explore-grid');
    if (!exploreGrid) return;
    
    exploreGrid.innerHTML = '';
    
    exploreUsers.forEach(user => {
        const card = document.createElement('div');
        card.className = 'explore-card';
        card.innerHTML = `
            <div class="explore-card-image">
                <img src="${user.image}" alt="${user.name}">
                <div class="explore-card-distance">${user.distance}</div>
            </div>
            <div class="explore-card-info">
                <h4>${user.name}, ${user.age}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${user.location}</p>
                <div class="explore-card-actions">
                    <button class="btn-like ${user.liked ? 'liked' : ''}" data-user-id="${user.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-message" data-user-id="${user.id}">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            </div>
        `;
        exploreGrid.appendChild(card);
    });
    
    // Adicionar event listeners para os botões
    document.querySelectorAll('.explore-card .btn-like').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const userId = parseInt(this.dataset.userId);
            const user = exploreUsers.find(u => u.id === userId);
            
            if (user) {
                user.liked = !user.liked;
                this.classList.toggle('liked');
                
                if (user.liked) {
                    createHeartAnimation(this);
                    showNotification(`Você curtiu ${user.name}!`);
                } else {
                    showNotification(`Você descurtiu ${user.name}`);
                }
            }
        });
    });
    
    document.querySelectorAll('.explore-card .btn-message').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const userId = parseInt(this.dataset.userId);
            const user = exploreUsers.find(u => u.id === userId);
            
            if (user) {
                showNotification(`Mensagem enviada para ${user.name}!`);
            }
        });
    });
}

// Função para popular a página de mensagens
function populateMessagesScreen() {
    const messageList = document.querySelector('.message-list');
    if (!messageList) return;
    
    messageList.innerHTML = '';
    
    chatData.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <img src="${chat.avatar}" alt="${chat.name}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-last-message">${chat.lastMessage}</div>
                <div class="chat-time">${chat.time}</div>
            </div>
        `;
        
        chatItem.addEventListener('click', () => {
            showNotification(`Abrindo conversa com ${chat.name}`);
        });
        
        messageList.appendChild(chatItem);
    });
}

// Função para inicializar criação de post
function initializeCreatePost() {
    const createPostBtn = document.querySelector('.camera-btn');
    const modal = document.getElementById('createPostModal');
    const closeBtn = modal?.querySelector('.modal-close');
    const cancelBtn = modal?.querySelector('.btn-cancel');
    const publishBtn = modal?.querySelector('.btn-publish');
    const textarea = modal?.querySelector('textarea');
    
    if (createPostBtn && modal) {
        createPostBtn.addEventListener('click', () => {
            modal.classList.add('active');
            if (textarea) textarea.value = '';
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        if (publishBtn && textarea) {
            publishBtn.addEventListener('click', () => {
                const content = textarea.value.trim();
                if (content) {
                    showNotification('Post publicado com sucesso!');
                    modal.classList.remove('active');
                    textarea.value = '';
                } else {
                    showNotification('Escreva algo para publicar!');
                }
            });
        }
        
        // Fechar modal clicando fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Função para inicializar sistema de likes
function initializeViewLikes() {
    const likesModal = document.getElementById('likesModal');
    const closeLikesBtn = likesModal?.querySelector('.modal-close');
    
    // Event listeners para "ver curtidas"
    document.querySelectorAll('.post-likes').forEach(likesElement => {
        likesElement.addEventListener('click', () => {
            if (likesModal) {
                likesModal.classList.add('active');
                populateLikesModal();
            }
        });
    });
    
    if (closeLikesBtn && likesModal) {
        closeLikesBtn.addEventListener('click', () => {
            likesModal.classList.remove('active');
        });
        
        likesModal.addEventListener('click', (e) => {
            if (e.target === likesModal) {
                likesModal.classList.remove('active');
            }
        });
    }
}

// Função para popular modal de likes
function populateLikesModal() {
    const likesList = document.querySelector('.likes-list');
    if (!likesList) return;
    
    const sampleLikes = [
        { name: 'Ana Silva', username: '@ana_silva', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=50&h=50&fit=crop&crop=face' },
        { name: 'Carlos Santos', username: '@carlos_santos', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
        { name: 'Beatriz Costa', username: '@beatriz_costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
    ];
    
    likesList.innerHTML = '';
    
    sampleLikes.forEach(user => {
        const likeItem = document.createElement('div');
        likeItem.className = 'like-item';
        likeItem.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}" class="like-avatar">
            <div class="like-info">
                <h4>${user.name}</h4>
                <p>${user.username}</p>
            </div>
        `;
        likesList.appendChild(likeItem);
    });
}

// Função para navegação entre telas
function showScreen(screenName) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela selecionada
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;
        
        // Carregar conteúdo específico da tela
        if (screenName === 'explore') {
            populateExploreScreen();
        } else if (screenName === 'messages') {
            populateMessagesScreen();
        }
    }
    
    // Atualizar botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-screen="${screenName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Função para inicializar o sistema de curtidas
function initializeLikeSystem() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const icon = this.querySelector('i');
            const post = this.closest('.modern-post');
            const likesElement = post.querySelector('.post-likes span');
            
            // Toggle do estado de curtida
            const isLiked = icon.classList.contains('fas');
            
            if (isLiked) {
                // Descurtir
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.classList.remove('liked');
                
                // Atualizar contador
                const currentLikes = parseInt(likesElement.textContent.match(/\d+/)[0]);
                likesElement.textContent = `❤️ ${currentLikes - 1} curtidas`;
                
                showNotification('Post descurtido');
            } else {
                // Curtir
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.classList.add('liked');
                
                // Criar animação de coração
                createHeartAnimation(this);
                
                // Atualizar contador
                const currentLikes = parseInt(likesElement.textContent.match(/\d+/)[0]);
                likesElement.textContent = `❤️ ${currentLikes + 1} curtidas`;
                
                showNotification('Post curtido!');
            }
        });
    });
    
    // Event listeners para comentários
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showNotification('Abrindo comentários...');
        });
    });
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado, iniciando app...');
    
    // DEBUG: Verificar se os elementos existem
    const homeScreen = document.getElementById('home-screen');
    const postsSection = document.querySelector('.posts-section');
    const postsContainer = document.querySelector('.posts-container');
    const posts = document.querySelectorAll('.modern-post');
    
    console.log('📱 Home screen:', homeScreen);
    console.log('📝 Posts section:', postsSection);
    console.log('📦 Posts container:', postsContainer);
    console.log('📄 Posts encontrados:', posts.length);
    
    // Forçar visibilidade
    if (homeScreen) {
        homeScreen.style.display = 'flex';
        homeScreen.style.visibility = 'visible';
        homeScreen.style.opacity = '1';
        console.log('✅ Home screen forçado a ser visível');
    }
    
    if (postsSection) {
        postsSection.style.display = 'block';
        postsSection.style.visibility = 'visible';
        postsSection.style.opacity = '1';
        console.log('✅ Posts section forçado a ser visível');
    }
    
    if (postsContainer) {
        postsContainer.style.display = 'flex';
        postsContainer.style.visibility = 'visible';
        postsContainer.style.opacity = '1';
        console.log('✅ Posts container forçado a ser visível');
    }
    
    posts.forEach((post, index) => {
        post.style.display = 'block';
        post.style.visibility = 'visible';
        post.style.opacity = '1';
        console.log(`✅ Post ${index + 1} forçado a ser visível`);
    });
    
    // Inicializar funcionalidades
    initializeCreatePost();
    initializeViewLikes();
    initializeLikeSystem();
    
    // Configurar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screenName = this.dataset.screen;
            if (screenName) {
                showScreen(screenName);
            }
        });
    });
    
    // Mostrar tela inicial
    showScreen('home');
    
    // Carregar conteúdo inicial da página explorar
    populateExploreScreen();
    
    // Configurar perfil
    const profileName = document.querySelector('.profile-name');
    if (profileName) {
        profileName.textContent = currentUser;
    }
    
    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            showNotification('Logout realizado com sucesso!');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }
    
    console.log('🎉 App inicializado com sucesso!');
});