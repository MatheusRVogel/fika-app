const express = require('express');
const router = express.Router();
const stripeService = require('../public/stripe-service');
const { userService } = require('../public/supabase-service');

// Middleware para verificar autenticação
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token de acesso necessário' });
        }

        // Verificar token com Supabase
        const user = await userService.verifyToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(401).json({ error: 'Erro na autenticação' });
    }
};

// Configuração pública do Stripe
router.get('/config', async (req, res) => {
    try {
        res.json({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51RocOTQ6e1GHbuA9arnxGi1toTcQsl6DG3WQ43qNWi1IGZLfAaBWrP1tivot4it45Qb6mvoZUlwcdTkOGE7Qa9zt00I3RdLeq7'
        });
    } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar sessão de checkout
router.post('/create-checkout-session', authenticateUser, async (req, res) => {
    try {
        const { planType, successUrl, cancelUrl } = req.body;
        const userId = req.user.id;

        // Definir preços baseado no plano
        const priceIds = {
            monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_premium',
            yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_premium'
        };

        const priceId = priceIds[planType] || priceIds.monthly;

        // Criar sessão de checkout
        const session = await stripeService.createCheckoutSession(
            userId,
            priceId,
            successUrl,
            cancelUrl
        );

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Verificar status da assinatura
router.get('/subscription-status', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Buscar dados do usuário no Supabase
        const userProfile = await userService.getProfile(userId);
        
        if (!userProfile) {
            return res.json({ isPremium: false });
        }

        let subscription = null;
        
        // Se tem customer ID do Stripe, verificar assinatura ativa
        if (userProfile.stripe_customer_id) {
            subscription = await stripeService.getSubscriptionStatus(userProfile.stripe_customer_id);
        }

        res.json({
            isPremium: userProfile.is_premium || false,
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end
            } : null
        });
    } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Cancelar assinatura
router.post('/cancel-subscription', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Buscar dados do usuário
        const userProfile = await userService.getProfile(userId);
        
        if (!userProfile || !userProfile.stripe_customer_id) {
            return res.status(404).json({ error: 'Assinatura não encontrada' });
        }

        // Buscar assinatura ativa
        const subscription = await stripeService.getSubscriptionStatus(userProfile.stripe_customer_id);
        
        if (!subscription) {
            return res.status(404).json({ error: 'Assinatura ativa não encontrada' });
        }

        // Cancelar assinatura
        const canceledSubscription = await stripeService.cancelSubscription(subscription.id);

        res.json({
            message: 'Assinatura cancelada com sucesso',
            subscription: {
                id: canceledSubscription.id,
                cancel_at_period_end: canceledSubscription.cancel_at_period_end,
                current_period_end: canceledSubscription.current_period_end
            }
        });
    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Webhook do Stripe
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Processar evento
        await stripeService.handleWebhook(event);

        res.json({ received: true });
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar trial gratuito
router.post('/create-trial', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, name } = req.body;

        // Verificar se usuário já tem trial ou assinatura
        const userProfile = await userService.getProfile(userId);
        
        if (userProfile && (userProfile.is_premium || userProfile.trial_used)) {
            return res.status(400).json({ error: 'Trial já utilizado ou usuário já é premium' });
        }

        // Criar trial
        const { customer, subscription } = await stripeService.createTrialSubscription(userId, email, name);

        // Atualizar usuário no Supabase
        await userService.updateProfile(userId, {
            stripe_customer_id: customer.id,
            trial_used: true,
            is_premium: true,
            premium_started_at: new Date().toISOString()
        });

        res.json({
            message: 'Trial criado com sucesso',
            trial_end: subscription.trial_end
        });
    } catch (error) {
        console.error('Erro ao criar trial:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar preços disponíveis
router.get('/prices', async (req, res) => {
    try {
        const prices = {
            monthly: {
                id: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_premium',
                amount: 1999, // R$ 19,99
                currency: 'brl',
                interval: 'month',
                display: 'R$ 19,99/mês'
            },
            yearly: {
                id: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_premium',
                amount: 19999, // R$ 199,99
                currency: 'brl',
                interval: 'year',
                display: 'R$ 199,99/ano',
                savings: 'Economize ~17%'
            }
        };

        res.json(prices);
    } catch (error) {
        console.error('Erro ao buscar preços:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;