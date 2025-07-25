// Configuração da API para o frontend
class FikaAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
        this.currentUser = null;
        this.token = localStorage.getItem('fika_token');
    }

    // Configurar headers padrão
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Fazer requisição HTTP
    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Autenticação
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.user) {
            this.setUser(response.user, response.session?.access_token);
        }

        return response;
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.user) {
            this.setUser(response.user, response.session?.access_token);
        }

        return response;
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('fika_token');
        localStorage.removeItem('fika_user');
        window.location.href = '/login';
    }

    setUser(user, token) {
        this.currentUser = user;
        if (token) {
            this.token = token;
            localStorage.setItem('fika_token', token);
        }
        localStorage.setItem('fika_user', JSON.stringify(user));
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('fika_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    // Perfil do usuário
    async getUserProfile(userId) {
        return await this.request(`/user/profile/${userId}`);
    }

    async updateProfile(userId, updates) {
        return await this.request(`/user/profile/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    // Explorar usuários
    async exploreUsers(userId, limit = 10, offset = 0) {
        return await this.request(`/explore/${userId}?limit=${limit}&offset=${offset}`);
    }

    // Likes e matches
    async likeUser(userId, likedUserId) {
        return await this.request('/like', {
            method: 'POST',
            body: JSON.stringify({ userId, likedUserId })
        });
    }

    async getMatches(userId) {
        return await this.request(`/matches/${userId}`);
    }

    // Mensagens
    async sendMessage(senderId, receiverId, content, type = 'text') {
        return await this.request('/messages', {
            method: 'POST',
            body: JSON.stringify({ senderId, receiverId, content, type })
        });
    }

    async getConversations(userId) {
        return await this.request(`/conversations/${userId}`);
    }

    async getConversationMessages(userId, otherUserId) {
        return await this.request(`/messages/${userId}/${otherUserId}`);
    }

    // Stripe/Premium
    async createCheckoutSession(priceId) {
        return await this.request('/stripe/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({ priceId })
        });
    }

    async getSubscriptionStatus() {
        return await this.request('/stripe/subscription-status');
    }

    async cancelSubscription() {
        return await this.request('/stripe/cancel-subscription', {
            method: 'POST'
        });
    }
}

// Configuração do Stripe
class FikaStripe {
    constructor() {
        this.stripe = null;
        this.initStripe();
    }

    async initStripe() {
        if (window.Stripe) {
            // Buscar chave pública do backend
            try {
                const response = await fetch('/api/stripe/config');
                const { publishableKey } = await response.json();
                this.stripe = Stripe(publishableKey);
            } catch (error) {
                console.error('Erro ao inicializar Stripe:', error);
            }
        }
    }

    async redirectToCheckout(sessionId) {
        if (!this.stripe) {
            throw new Error('Stripe não inicializado');
        }

        const { error } = await this.stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (error) {
            throw error;
        }
    }
}

// Utilitários
class FikaUtils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        
        return date.toLocaleDateString('pt-BR');
    }

    static calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static showToast(message, type = 'info') {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Estilos inline para garantir que funcione
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Cores baseadas no tipo
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };

        toast.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(toast);

        // Remover após 3 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar instâncias globais
window.fikaAPI = new FikaAPI();
window.fikaStripe = new FikaStripe();
window.fikaUtils = FikaUtils;

// Adicionar estilos para toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

console.log('🚀 Fika API inicializada!');