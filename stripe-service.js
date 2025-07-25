const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const stripeService = {
    // Criar sessão de checkout para assinatura premium
    async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: userId,
                metadata: {
                    userId: userId
                }
            });

            return session;
        } catch (error) {
            console.error('Erro ao criar sessão de checkout:', error);
            throw error;
        }
    },

    // Criar preços para assinatura
    async createSubscriptionPrices() {
        try {
            // Produto Premium
            const product = await stripe.products.create({
                name: 'Fika Premium',
                description: 'Acesso premium ao Fika com recursos exclusivos'
            });

            // Preço mensal
            const monthlyPrice = await stripe.prices.create({
                unit_amount: 1999, // R$ 19,99
                currency: 'brl',
                recurring: { interval: 'month' },
                product: product.id,
                nickname: 'Premium Mensal'
            });

            // Preço anual (com desconto)
            const yearlyPrice = await stripe.prices.create({
                unit_amount: 19999, // R$ 199,99 (economia de ~17%)
                currency: 'brl',
                recurring: { interval: 'year' },
                product: product.id,
                nickname: 'Premium Anual'
            });

            return {
                product,
                monthlyPrice,
                yearlyPrice
            };
        } catch (error) {
            console.error('Erro ao criar preços:', error);
            throw error;
        }
    },

    // Verificar status da assinatura
    async getSubscriptionStatus(customerId) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active'
            });

            return subscriptions.data.length > 0 ? subscriptions.data[0] : null;
        } catch (error) {
            console.error('Erro ao verificar assinatura:', error);
            throw error;
        }
    },

    // Cancelar assinatura
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });

            return subscription;
        } catch (error) {
            console.error('Erro ao cancelar assinatura:', error);
            throw error;
        }
    },

    // Criar customer no Stripe
    async createCustomer(email, name, userId) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    userId: userId
                }
            });

            return customer;
        } catch (error) {
            console.error('Erro ao criar customer:', error);
            throw error;
        }
    },

    // Webhook handler para eventos do Stripe
    async handleWebhook(event) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    const userId = session.client_reference_id;
                    
                    // Atualizar usuário para premium no Supabase
                    const { userService } = require('./supabase-service');
                    await userService.updateProfile(userId, {
                        is_premium: true,
                        premium_started_at: new Date().toISOString(),
                        stripe_customer_id: session.customer
                    });
                    
                    console.log(`Usuário ${userId} agora é premium`);
                    break;

                case 'customer.subscription.deleted':
                    const subscription = event.data.object;
                    const customerId = subscription.customer;
                    
                    // Buscar usuário pelo customer ID e remover premium
                    // Implementar busca no Supabase
                    console.log(`Assinatura cancelada para customer ${customerId}`);
                    break;

                case 'invoice.payment_failed':
                    const invoice = event.data.object;
                    console.log(`Pagamento falhou para ${invoice.customer}`);
                    break;

                default:
                    console.log(`Evento não tratado: ${event.type}`);
            }
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            throw error;
        }
    },

    // Criar trial gratuito
    async createTrialSubscription(userId, email, name) {
        try {
            // Criar customer
            const customer = await this.createCustomer(email, name, userId);

            // Criar assinatura com trial de 7 dias
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: 'price_premium_monthly_id' }], // Substituir pelo ID real
                trial_period_days: 7,
                metadata: {
                    userId: userId
                }
            });

            return { customer, subscription };
        } catch (error) {
            console.error('Erro ao criar trial:', error);
            throw error;
        }
    }
};

module.exports = stripeService;