// Gerenciador de funcionalidades premium
class PremiumManager {
    constructor() {
        this.isPremium = false;
        this.freeUserLimits = new FreeUserLimits();
        
        // Usuários gratuitos têm limitações específicas
        this.dailyLimits = {
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
        
        // Atualizar contadores na interface
        this.freeUserLimits.updateUsageCounters(isPremium);
    }

    // Verificar se pode dar like (sempre permitido)
    canLike() {
        return { allowed: true };
    }

    // Verificar se pode dar super like (sempre permitido)
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

    // Verificar se pode enviar mensagem (limitado para usuários gratuitos)
    canSendMessage() {
        return this.freeUserLimits.canSendMessage(this.isPremium);
    }

    // Verificar se pode criar post (limitado para usuários gratuitos)
    canCreatePost() {
        return this.freeUserLimits.canCreatePost(this.isPremium);
    }

    // Verificar se pode criar story (limitado para usuários gratuitos)
    canCreateStory() {
        return this.freeUserLimits.canCreateStory(this.isPremium);
    }

    // Verificar se pode iniciar nova conversa (apenas Premium)
    canStartConversation() {
        return this.freeUserLimits.canStartConversation(this.isPremium);
    }

    // Verificar se pode responder mensagem (sempre permitido)
    canReplyToMessage() {
        return { allowed: true };
    }

    // Verificar se pode ver quem visitou o perfil (apenas Premium)
    canSeeProfileVisitors() {
        return this.freeUserLimits.canSeeProfileVisitors(this.isPremium);
    }

    // Verificar se pode ver quem curtiu (apenas Premium)
    canSeeWhoLiked() {
        return this.freeUserLimits.canSeeWhoLiked(this.isPremium);
    }

    // Verificar funcionalidades exclusivas premium
    canAccessPremiumFeature(feature) {
        if (this.isPremium) return { allowed: true };
        
        const premiumFeatures = {
            'start_chat': 'Iniciar conversas é uma funcionalidade Premium! Você pode responder a mensagens recebidas.',
            'who_liked_me': 'Ver quem curtiu você é uma funcionalidade Premium!',
            'who_visited_me': 'Ver quem visitou seu perfil é uma funcionalidade Premium!',
            'boost_profile': 'Impulsionar perfil é uma funcionalidade Premium!',
            'global_location': 'Localização global é uma funcionalidade Premium!',
            'advanced_filters': 'Filtros avançados são uma funcionalidade Premium!',
            'read_receipts': 'Confirmação de leitura é uma funcionalidade Premium!',
            'unlimited_rewind': 'Desfazer curtidas é uma funcionalidade Premium!',
            'unlimited_posts': 'Posts ilimitados são uma funcionalidade Premium!',
            'unlimited_stories': 'Stories ilimitados são uma funcionalidade Premium!',
            'unlimited_messages': 'Mensagens ilimitadas são uma funcionalidade Premium!'
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

    // Registrar envio de mensagem
    recordMessage() {
        if (!this.isPremium) {
            this.freeUserLimits.recordMessage();
            this.freeUserLimits.updateUsageCounters(this.isPremium);
        }
    }

    // Registrar criação de post
    recordPost() {
        if (!this.isPremium) {
            this.freeUserLimits.recordPost();
            this.freeUserLimits.updateUsageCounters(this.isPremium);
        }
    }

    // Registrar criação de story
    recordStory() {
        if (!this.isPremium) {
            this.freeUserLimits.recordStory();
            this.freeUserLimits.updateUsageCounters(this.isPremium);
        }
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

        const freeStats = this.freeUserLimits.getUsageStats(this.isPremium);
        
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
            messages: freeStats.messages,
            posts: freeStats.posts,
            stories: freeStats.stories,
            chats: {
                canInitiate: false,
                canReply: true,
                message: 'Você pode responder mensagens, mas não iniciar conversas'
            },
            features: freeStats.features
        };
    }

    // Mostrar modal de upgrade
    showUpgradeModal(reason, message) {
        this.freeUserLimits.showUpgradeModal(reason, message);
    }
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