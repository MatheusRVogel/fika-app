// FIKAH - JavaScript Moderno e Funcional

// Estado da aplicação
const AppState = {
    currentScreen: 'home',
    user: {
        name: 'Você',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
    },
    notifications: [],
    posts: [],
    stories: []
};

// Utilitários
const Utils = {
    // Debounce para otimizar performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Formatação de números
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Formatação de tempo
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    },

    // Animação suave
    animate(element, keyframes, options = {}) {
        return element.animate(keyframes, {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards',
            ...options
        });
    }
};

// Sistema de Navegação Moderno
class NavigationManager {
    constructor() {
        this.screens = new Map();
        this.currentScreen = null;
        this.history = [];
        this.init();
    }

    init() {
        // Registrar todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens.set(screen.id.replace('-screen', ''), screen);
        });

        // Configurar botões de navegação
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const screenName = button.getAttribute('data-screen');
                if (screenName) {
                    this.navigateTo(screenName);
                }
            });
        });

        // Mostrar tela inicial
        this.navigateTo('home');
    }

    navigateTo(screenName) {
        const targetScreen = this.screens.get(screenName);
        if (!targetScreen) {
            console.error(`Tela '${screenName}' não encontrada`);
            return;
        }

        // Esconder tela atual
        if (this.currentScreen) {
            this.currentScreen.classList.remove('active');
        }

        // Mostrar nova tela com animação
        targetScreen.classList.add('active');
        this.currentScreen = targetScreen;

        // Atualizar navegação
        this.updateNavigation(screenName);

        // Adicionar ao histórico
        this.history.push(screenName);
        AppState.currentScreen = screenName;

        // Trigger evento personalizado
        document.dispatchEvent(new CustomEvent('screenChanged', {
            detail: { screen: screenName }
        }));

        console.log(`Navegou para: ${screenName}`);
    }

    updateNavigation(activeScreen) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const screenName = btn.getAttribute('data-screen');
            if (screenName === activeScreen) {
                btn.classList.add('active');
                Utils.animate(btn, [
                    { transform: 'translateY(0) scale(1)' },
                    { transform: 'translateY(-2px) scale(1.05)' },
                    { transform: 'translateY(-2px) scale(1)' }
                ]);
            } else {
                btn.classList.remove('active');
            }
        });
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current
            const previousScreen = this.history[this.history.length - 1];
            this.navigateTo(previousScreen);
        }
    }
}

// Sistema de Posts Moderno
class PostManager {
    constructor() {
        this.posts = new Map();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPosts();
    }

    bindEvents() {
        // Delegação de eventos para melhor performance
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                this.handleLike(e.target.closest('.like-btn'));
            } else if (e.target.closest('.comment-btn')) {
                this.handleComment(e.target.closest('.comment-btn'));
            } else if (e.target.closest('.share-btn')) {
                this.handleShare(e.target.closest('.share-btn'));
            } else if (e.target.closest('.add-comment button')) {
                this.handleAddComment(e.target.closest('.add-comment'));
            }
        });

        // Enter para comentários
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.closest('.add-comment input')) {
                this.handleAddComment(e.target.closest('.add-comment'));
            }
        });
    }

    handleLike(button) {
        const post = button.closest('.modern-post');
        const postId = post.dataset.postId || Math.random().toString(36);
        const isLiked = button.classList.contains('liked');
        const likesElement = post.querySelector('.post-likes');

        // Animação do botão
        Utils.animate(button, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.3)' },
            { transform: 'scale(1)' }
        ], { duration: 600 });

        if (isLiked) {
            button.classList.remove('liked');
            button.innerHTML = '<i class="fa fa-heart"></i>';
            this.updateLikesCount(likesElement, -1);
            NotificationManager.show('Curtida removida', 'info');
        } else {
            button.classList.add('liked');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            this.updateLikesCount(likesElement, 1);
            NotificationManager.show('Post curtido! ❤️', 'success');
        }

        // Salvar estado
        post.dataset.postId = postId;
    }

    updateLikesCount(element, change) {
        if (!element) return;

        const currentText = element.textContent;
        const match = currentText.match(/(\d+)/);
        const currentCount = match ? parseInt(match[1]) : 0;
        const newCount = Math.max(0, currentCount + change);

        element.textContent = `${Utils.formatNumber(newCount)} curtidas`;

        // Animação do contador
        Utils.animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
        ], { duration: 300 });
    }

    handleComment(button) {
        const post = button.closest('.modern-post');
        const commentsSection = post.querySelector('.add-comment input');
        if (commentsSection) {
            commentsSection.focus();
            Utils.animate(commentsSection, [
                { transform: 'scale(1)' },
                { transform: 'scale(1.02)' },
                { transform: 'scale(1)' }
            ]);
        }
        NotificationManager.show('Seção de comentários em desenvolvimento', 'info');
    }

    handleShare(button) {
        const post = button.closest('.modern-post');
        const userName = post.querySelector('.post-user-details h4')?.textContent || 'Usuário';
        
        if (navigator.share) {
            navigator.share({
                title: 'FIKAH - Post',
                text: `Confira este post de ${userName} no FIKAH!`,
                url: window.location.href
            });
        } else {
            // Fallback para navegadores sem Web Share API
            navigator.clipboard.writeText(window.location.href);
            NotificationManager.show('Link copiado para a área de transferência!', 'success');
        }
    }

    handleAddComment(commentForm) {
        const input = commentForm.querySelector('input');
        const text = input.value.trim();
        
        if (text) {
            // Animação de envio
            const button = commentForm.querySelector('button');
            Utils.animate(button, [
                { transform: 'scale(1)' },
                { transform: 'scale(0.95)' },
                { transform: 'scale(1)' }
            ]);

            NotificationManager.show('Comentário adicionado!', 'success');
            input.value = '';
        }
    }

    loadPosts() {
        // Simular carregamento de posts
        console.log('Posts carregados');
    }
}

// Sistema de Stories Moderno
class StoryManager {
    constructor() {
        this.stories = new Map();
        this.currentStoryIndex = 0;
        this.init();
    }

    init() {
        document.querySelectorAll('.story-item').forEach(story => {
            story.addEventListener('click', () => {
                this.openStory(story);
            });
        });
    }

    openStory(storyElement) {
        const username = storyElement.querySelector('.story-username')?.textContent || 'Usuário';
        const avatar = storyElement.querySelector('.story-avatar img')?.src;

        // Animação de abertura
        Utils.animate(storyElement, [
            { transform: 'scale(1)' },
            { transform: 'scale(0.95)' },
            { transform: 'scale(1)' }
        ]);

        NotificationManager.show(`Visualizando story de ${username}`, 'info');
        
        // Aqui seria implementado o viewer de stories
        console.log('Abrindo story:', { username, avatar });
    }
}

// Sistema de Notificações Moderno
class NotificationManager {
    static notifications = [];
    static container = null;

    static init() {
        // Criar container se não existir
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            this.container.style.cssText = `
                position: fixed;
                top: 90px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 3000;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    }

    static show(message, type = 'info', duration = 3000) {
        this.init();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Adicionar classe de tipo
        notification.classList.add(`notification-${type}`);
        
        // Estilos baseados no tipo
        const styles = {
            success: 'background: #10b981; color: white;',
            error: 'background: #ef4444; color: white;',
            warning: 'background: #f59e0b; color: white;',
            info: 'background: white; color: #1e293b; border: 1px solid #e2e8f0;'
        };
        
        notification.style.cssText += styles[type] || styles.info;

        this.container.appendChild(notification);

        // Animação de entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remover após duração especificada
        setTimeout(() => {
            this.hide(notification);
        }, duration);

        return notification;
    }

    static hide(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Sistema de Busca Moderno
class SearchManager {
    constructor() {
        this.searchInputs = document.querySelectorAll('input[type="search"], .search-input');
        this.init();
    }

    init() {
        this.searchInputs.forEach(input => {
            const debouncedSearch = Utils.debounce((query) => {
                this.performSearch(query);
            }, 300);

            input.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        });
    }

    performSearch(query) {
        if (query.length < 2) return;
        
        console.log('Buscando:', query);
        NotificationManager.show(`Buscando por "${query}"...`, 'info', 1500);
        
        // Aqui seria implementada a busca real
    }
}

// Sistema de Configurações
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        // Aplicar configurações salvas
        this.applySettings();
        
        // Configurar listeners
        this.bindEvents();
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('fikah-settings')) || {
                theme: 'light',
                notifications: true,
                location: true,
                distance: 25
            };
        } catch {
            return {
                theme: 'light',
                notifications: true,
                location: true,
                distance: 25
            };
        }
    }

    saveSettings() {
        localStorage.setItem('fikah-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        // Aplicar tema
        document.body.setAttribute('data-theme', this.settings.theme);
        
        // Aplicar outras configurações
        console.log('Configurações aplicadas:', this.settings);
    }

    bindEvents() {
        // Botão de distância
        const distanceBtn = document.querySelector('.distance-btn');
        if (distanceBtn) {
            distanceBtn.addEventListener('click', () => {
                this.showDistanceSelector();
            });
        }
    }

    showDistanceSelector() {
        NotificationManager.show('Seletor de distância em desenvolvimento', 'info');
    }
}

// Inicialização da Aplicação
class FikahApp {
    constructor() {
        this.navigation = null;
        this.postManager = null;
        this.storyManager = null;
        this.searchManager = null;
        this.settingsManager = null;
        this.init();
    }

    init() {
        console.log('🚀 FIKAH App iniciando...');
        
        // Aguardar DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        try {
            // Inicializar sistemas
            this.navigation = new NavigationManager();
            this.postManager = new PostManager();
            this.storyManager = new StoryManager();
            this.searchManager = new SearchManager();
            this.settingsManager = new SettingsManager();
            
            // Configurar eventos globais
            this.bindGlobalEvents();
            
            // Mostrar notificação de boas-vindas
            setTimeout(() => {
                NotificationManager.show('Bem-vindo ao FIKAH! 💕', 'success');
            }, 1000);
            
            console.log('✅ FIKAH App iniciado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar FIKAH App:', error);
            NotificationManager.show('Erro ao carregar aplicação', 'error');
        }
    }

    bindGlobalEvents() {
        // Listener para mudanças de tela
        document.addEventListener('screenChanged', (e) => {
            console.log(`📱 Tela alterada para: ${e.detail.screen}`);
        });

        // Listener para erros globais
        window.addEventListener('error', (e) => {
            console.error('Erro global:', e.error);
            NotificationManager.show('Ops! Algo deu errado', 'error');
        });

        // Listener para back button (mobile)
        window.addEventListener('popstate', () => {
            if (this.navigation) {
                this.navigation.goBack();
            }
        });

        // Listener para visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('App em background');
            } else {
                console.log('App em foreground');
            }
        });
    }
}

// Função de debug melhorada
function debugApp() {
    console.group('🔍 FIKAH Debug Info');
    console.log('Estado atual:', AppState);
    console.log('Telas disponíveis:', document.querySelectorAll('.screen').length);
    console.log('Tela ativa:', document.querySelector('.screen.active')?.id || 'Nenhuma');
    console.log('Posts:', document.querySelectorAll('.modern-post').length);
    console.log('Stories:', document.querySelectorAll('.story-item').length);
    console.log('Navegação ativa:', document.querySelector('.nav-btn.active')?.dataset.screen || 'Nenhuma');
    console.groupEnd();
}

// Inicializar aplicação
const app = new FikahApp();

// Expor funções globais
window.debugApp = debugApp;
window.FikahApp = app;
window.NotificationManager = NotificationManager;