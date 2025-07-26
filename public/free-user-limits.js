// Gerenciador de limitações para usuários gratuitos
class FreeUserLimits {
    constructor() {
        this.dailyLimits = {
            messages: 5,        // Máximo 5 mensagens por dia
            posts: 5,          // Máximo 5 posts por dia
            stories: 5         // Máximo 5 stories por dia
        };
        this.usage = this.loadDailyUsage();
    }

    // Carregar uso diário do localStorage
    loadDailyUsage() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('freeUserDailyUsage');
        
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
            messages: 0,
            posts: 0,
            stories: 0
        };
        this.saveDailyUsage(usage);
        return usage;
    }

    // Salvar uso diário no localStorage
    saveDailyUsage(usage) {
        localStorage.setItem('freeUserDailyUsage', JSON.stringify(usage));
        this.usage = usage;
    }

    // Verificar se pode enviar mensagem
    canSendMessage(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        if (this.usage.messages >= this.dailyLimits.messages) {
            return {
                allowed: false,
                reason: 'daily_limit_reached',
                message: `Você atingiu o limite de ${this.dailyLimits.messages} mensagens por dia. Upgrade para Premium para mensagens ilimitadas!`,
                remaining: 0,
                limit: this.dailyLimits.messages
            };
        }

        return {
            allowed: true,
            remaining: this.dailyLimits.messages - this.usage.messages,
            limit: this.dailyLimits.messages
        };
    }

    // Verificar se pode criar post
    canCreatePost(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        if (this.usage.posts >= this.dailyLimits.posts) {
            return {
                allowed: false,
                reason: 'daily_limit_reached',
                message: `Você atingiu o limite de ${this.dailyLimits.posts} posts por dia. Upgrade para Premium para posts ilimitados!`,
                remaining: 0,
                limit: this.dailyLimits.posts
            };
        }

        return {
            allowed: true,
            remaining: this.dailyLimits.posts - this.usage.posts,
            limit: this.dailyLimits.posts
        };
    }

    // Verificar se pode criar story
    canCreateStory(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        if (this.usage.stories >= this.dailyLimits.stories) {
            return {
                allowed: false,
                reason: 'daily_limit_reached',
                message: `Você atingiu o limite de ${this.dailyLimits.stories} stories por dia. Upgrade para Premium para stories ilimitados!`,
                remaining: 0,
                limit: this.dailyLimits.stories
            };
        }

        return {
            allowed: true,
            remaining: this.dailyLimits.stories - this.usage.stories,
            limit: this.dailyLimits.stories
        };
    }

    // Verificar se pode iniciar conversa (sempre negado para usuários gratuitos)
    canStartConversation(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'premium_only',
            message: 'Iniciar conversas é uma funcionalidade Premium! Você pode responder a mensagens recebidas gratuitamente.'
        };
    }

    // Verificar se pode ver quem visitou o perfil
    canSeeProfileVisitors(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'premium_only',
            message: 'Ver quem visitou seu perfil é uma funcionalidade Premium!'
        };
    }

    // Verificar se pode ver quem curtiu
    canSeeWhoLiked(isPremium = false) {
        if (isPremium) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'premium_only',
            message: 'Ver quem curtiu você é uma funcionalidade Premium!'
        };
    }

    // Registrar uso de mensagem
    recordMessage() {
        this.usage.messages++;
        this.saveDailyUsage(this.usage);
    }

    // Registrar uso de post
    recordPost() {
        this.usage.posts++;
        this.saveDailyUsage(this.usage);
    }

    // Registrar uso de story
    recordStory() {
        this.usage.stories++;
        this.saveDailyUsage(this.usage);
    }

    // Obter estatísticas de uso
    getUsageStats(isPremium = false) {
        if (isPremium) {
            return {
                isPremium: true,
                message: 'Você tem acesso ilimitado a todas as funcionalidades!',
                features: {
                    messages: 'Ilimitadas',
                    posts: 'Ilimitados',
                    stories: 'Ilimitados',
                    startConversations: 'Permitido',
                    seeProfileVisitors: 'Permitido',
                    seeWhoLiked: 'Permitido'
                }
            };
        }

        return {
            isPremium: false,
            messages: {
                used: this.usage.messages,
                limit: this.dailyLimits.messages,
                remaining: this.dailyLimits.messages - this.usage.messages
            },
            posts: {
                used: this.usage.posts,
                limit: this.dailyLimits.posts,
                remaining: this.dailyLimits.posts - this.usage.posts
            },
            stories: {
                used: this.usage.stories,
                limit: this.dailyLimits.stories,
                remaining: this.dailyLimits.stories - this.usage.stories
            },
            features: {
                startConversations: 'Bloqueado (Premium)',
                seeProfileVisitors: 'Bloqueado (Premium)',
                seeWhoLiked: 'Bloqueado (Premium)',
                likeAndComment: 'Permitido',
                receiveMessages: 'Permitido'
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
                                <span class="benefit-icon">💬</span>
                                <span>Chat completo (enviar e receber)</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">📝</span>
                                <span>Posts e stories ilimitados</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">👀</span>
                                <span>Ver quem visitou seu perfil</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">💖</span>
                                <span>Ver quem curtiu você</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">🔥</span>
                                <span>Super Likes diários</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-icon">✅</span>
                                <span>Verificação de perfil</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pricing-options">
                        <div class="price-option">
                            <h4>Premium Mensal</h4>
                            <div class="price">R$ 24,90/mês</div>
                        </div>
                        <div class="price-option recommended">
                            <h4>Premium Anual</h4>
                            <div class="price">R$ 19,90/mês</div>
                            <div class="savings">Economize 20%</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-modal">Continuar Grátis</button>
                    <button class="btn-primary upgrade-btn" onclick="window.location.href='#premium'">Fazer Upgrade</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Atualizar contadores na interface
    updateUsageCounters(isPremium = false) {
        const stats = this.getUsageStats(isPremium);
        const usageCounters = document.getElementById('usage-counters');
        
        if (!usageCounters) return;
        
        if (isPremium) {
            // Ocultar contadores para usuários premium
            usageCounters.style.display = 'none';
            return;
        }
        
        // Mostrar contadores para usuários gratuitos
        usageCounters.style.display = 'block';
        usageCounters.innerHTML = `
            <div class="usage-counter messages-counter ${stats.messages.remaining === 0 ? 'limit-reached' : ''}">
                <span class="counter-label">Mensagens:</span> 
                <span class="counter-value">${stats.messages.remaining}/${stats.messages.limit} restantes</span>
            </div>
            <div class="usage-counter posts-counter ${stats.posts.remaining === 0 ? 'limit-reached' : ''}">
                <span class="counter-label">Posts:</span> 
                <span class="counter-value">${stats.posts.remaining}/${stats.posts.limit} restantes</span>
            </div>
            <div class="usage-counter stories-counter ${stats.stories.remaining === 0 ? 'limit-reached' : ''}">
                <span class="counter-label">Stories:</span> 
                <span class="counter-value">${stats.stories.remaining}/${stats.stories.limit} restantes</span>
            </div>
            <div class="usage-counter features-info">
                <span class="counter-label">Chat:</span> 
                <span class="counter-value">Apenas responder</span>
            </div>
        `;
    }
}

// Tornar disponível globalmente
window.FreeUserLimits = FreeUserLimits;