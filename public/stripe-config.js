// Configuração do Stripe para o frontend
const STRIPE_CONFIG = {
    publishableKey: 'pk_live_51RocOTQ6e1GHbuA9arnxGi1toTcQsl6DG3WQ43qNWi1IGZLfAaBWrP1tivot4it45Qb6mvoZUlwcdTkOGE7Qa9zt00I3RdLeq7',
    
    // Preços dos planos (IDs serão atualizados após criação no Stripe)
    prices: {
        monthly: 'price_monthly_premium', // Será substituído pelo ID real
        yearly: 'price_yearly_premium'    // Será substituído pelo ID real
    },
    
    // URLs de redirecionamento
    urls: {
        success: window.location.origin + '/app?payment=success',
        cancel: window.location.origin + '/app?payment=cancel'
    }
};

// Inicializar Stripe
let stripe;

// Função para carregar o Stripe
async function initializeStripe() {
    if (!stripe) {
        // Carregar Stripe.js dinamicamente
        if (!window.Stripe) {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
        
        stripe = Stripe(STRIPE_CONFIG.publishableKey);
    }
    return stripe;
}

// Serviço de pagamento
const PaymentService = {
    // Criar sessão de checkout
    async createCheckoutSession(planType = 'monthly') {
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    planType,
                    successUrl: STRIPE_CONFIG.urls.success,
                    cancelUrl: STRIPE_CONFIG.urls.cancel
                })
            });

            const session = await response.json();
            
            if (!response.ok) {
                throw new Error(session.error || 'Erro ao criar sessão de pagamento');
            }

            return session;
        } catch (error) {
            console.error('Erro ao criar checkout:', error);
            throw error;
        }
    },

    // Redirecionar para checkout
    async redirectToCheckout(planType = 'monthly') {
        try {
            const stripeInstance = await initializeStripe();
            const session = await this.createCheckoutSession(planType);
            
            const { error } = await stripeInstance.redirectToCheckout({
                sessionId: session.id
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Erro no checkout:', error);
            this.showPaymentError(error.message);
        }
    },

    // Verificar status da assinatura
    async getSubscriptionStatus() {
        try {
            const response = await fetch('/api/subscription-status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao verificar assinatura:', error);
            return { isPremium: false };
        }
    },

    // Cancelar assinatura
    async cancelSubscription() {
        try {
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao cancelar assinatura');
            }

            return data;
        } catch (error) {
            console.error('Erro ao cancelar assinatura:', error);
            throw error;
        }
    },

    // Mostrar erro de pagamento
    showPaymentError(message) {
        // Criar notificação de erro
        const notification = document.createElement('div');
        notification.className = 'payment-error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>Erro no pagamento: ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    // Mostrar sucesso de pagamento
    showPaymentSuccess(message = 'Pagamento realizado com sucesso!') {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
};

// Verificar parâmetros de URL para status de pagamento
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
        PaymentService.showPaymentSuccess('Bem-vindo ao Fika Premium! 🎉');
        // Remover parâmetro da URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
        PaymentService.showPaymentError('Pagamento cancelado. Você pode tentar novamente a qualquer momento.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Exportar para uso global
window.PaymentService = PaymentService;
window.STRIPE_CONFIG = STRIPE_CONFIG;