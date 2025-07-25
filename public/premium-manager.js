// Gerenciador de funcionalidades premium
class PremiumManager {
    constructor() {
        this.isPremium = false;
        // Usuários gratuitos podem curtir, seguir e comentar livremente
        // Apenas iniciar chats é restrito ao Premium
        this.dailyLimits = {
            // Removidos os limites de likes - agora são ilimitados para todos
            // likes: Infinity,
            // superLikes: Infinity,
            // Apenas conversas iniciadas são limitadas
            initiatedChats: 0  // Usuários gratuitos não podem iniciar chats
        };
        this.usage = this.loadDailyUsage();
    }

    // Carregar uso diário do localStorage
    loadDailyUsage() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyUsage');
        
        if (stored) {
            const usage = JSON.parse(stored);
            // Se é um novo dia, resetar contadores
            if (usage.date !== today) {
                return this.resetDailyUsage();
            }
            return usage;
        }
        
        return this.resetDailyUsage();
    }

    // Resetar contadores diários
    resetDailyUsage() {
        const usage = {
            date: new Date().toDateString(),
            initiatedChats: 0
        };
        this.saveDailyUsage(usage);
        return usage;
    }

    // Salvar uso diário no localStorage
    saveDailyUsage(usage) {
        localStorage.setItem('dailyUsage', JSON.stringify(usage));
        this.usage = usage;
    }

    // Definir status premium
    setPremiumStatus(isPremium) {
        this.isPremium = isPremium;
        console.log(`Status premium atualizado: ${isPremium ? 'Premium' : 'Gratuito'}`);
    }

    // Verificar se pode dar like (agora sempre permitido)
    canLike() {
        return { allowed: true };
    }

    // Verificar se pode dar super like (agora sempre permitido)
    canSuperLike() {
        return { allowed: true };
    }

    // Verificar se pode seguir usuário (sempre permitido)
    canFollow() {
        return { allowed: true };
    }

    // Verificar se pode comentar (sempre permitido)
    canComment() {
        return { allowed: true };
    }

    // Verificar se pode iniciar nova conversa (apenas Premium)
    canStartConversation() {
        if (this.isPremium) return { allowed: true };
        
        return {
            allowed: false,
            reason: 'premium_only',
            message: 'Iniciar conversas é uma funcionalidade Premium! Você pode responder a mensagens recebidas gratuitamente.'
        };
    }

    // Verificar se pode responder mensagem (sempre permitido)
    canReplyToMessage() {
        return { allowed: true };
    }

    // Verificar funcionalidades exclusivas premium
    canAccessPremiumFeature(feature) {
        if (this.isPremium) return { allowed: true };
        
        const premiumFeatures = {
            'start_chat': 'Iniciar conversas é uma funcionalidade Premium! Você pode responder a mensagens recebidas.',
            'who_liked_me': 'Ver quem curtiu você é uma funcionalidade Premium!',
            'boost_profile': 'Impulsionar perfil é uma funcionalidade Premium!',
            'global_location': 'Localização global é uma funcionalidade Premium!',
            'advanced_filters': 'Filtros avançados são uma funcionalidade Premium!',
            'read_receipts': 'Confirmação de leitura é uma funcionalidade Premium!',
            'unlimited_rewind': 'Desfazer curtidas é uma funcionalidade Premium!'
        };
        
        return {
            allowed: false,
            reason: 'premium_only',
            message: premiumFeatures[feature] || 'Esta é uma funcionalidade Premium!'
        };
    }

    // Registrar uso de like (não precisa mais registrar - ilimitado)
    recordLike() {
        // Likes são ilimitados para todos os usuários
        return;
    }

    // Registrar uso de super like (não precisa mais registrar - ilimitado)
    recordSuperLike() {
        // Super likes são ilimitados para todos os usuários
        return;
    }

    // Registrar nova conversa iniciada
    recordNewConversation() {
        if (!this.isPremium) {
            this.usage.initiatedChats++;
            this.saveDailyUsage(this.usage);
        }
    }

    // Obter estatísticas de uso
    getUsageStats() {
        if (this.isPremium) {
            return {
                isPremium: true,
                message: 'Você tem acesso ilimitado a todas as funcionalidades!'
            };
        }

        return {
            isPremium: false,
            likes: {
                used: 0,
                limit: 'Ilimitado',
                remaining: 'Ilimitado'
            },
            superLikes: {
                used: 0,
                limit: 'Ilimitado', 
                remaining: 'Ilimitado'
            },
            chats: {
                canInitiate: false,
                canReply: true,
                message: 'Você pode responder mensagens, mas não iniciar conversas'
            }
        };
    }

    // Mostrar modal de upgrade
    showUpgradeModal(reason, message) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay upgrade-modal';
        modal.innerHTML = `
            <div class="modal-content upgrade-modal-content">
                <div class="modal-header">
                    <h2>🚀 Upgrade para Premium</h2>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <div class="upgrade-message">
                        <div class="upgrade-icon">⭐</div>
                        <p>${message}</p>
                    </div>
                    
                    <div class="premium-benefits">
                        <h3>Com o Premium você tem:</h3>
                        <div class="benefit-list">
                            <div class="benefit-item">
                                <span class="benefit-icon">💖</span>
                                <span>Curtidas ilimitadas</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">🔥</span>
                                <span>Super Likes ilimitados</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">💬</span>
                                <span>Conversas ilimitadas</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">👑</span>
                                <span>Perfil em destaque</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">🌍</span>
                                <span>Localização global</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">👀</span>
                                <span>Ver quem curtiu você</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="upgrade-actions">
                        <button class="btn-upgrade-premium">Assinar Premium</button>
                        <button class="btn-upgrade-later">Talvez depois</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.btn-upgrade-later').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.btn-upgrade-premium').addEventListener('click', () => {
            modal.remove();
            // Abrir modal de premium do app
            if (window.app && window.app.showPremiumModal) {
                window.app.showPremiumModal();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Exportar para uso global
window.PremiumManager = PremiumManager;