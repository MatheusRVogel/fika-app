const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  // Criar sessão de checkout
  async createCheckoutSession(priceId, customerId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
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
      });

      return { success: true, sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  // Criar cliente
  async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });

      return { success: true, customerId: customer.id };
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  // Buscar assinaturas do cliente
  async getCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
      });

      return { success: true, subscriptions: subscriptions.data };
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      throw error;
    }
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);

      return { success: true, subscription };
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  // Webhook para eventos do Stripe
  async handleWebhook(body, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'customer.subscription.created':
          console.log('Assinatura criada:', event.data.object);
          break;
        case 'customer.subscription.updated':
          console.log('Assinatura atualizada:', event.data.object);
          break;
        case 'customer.subscription.deleted':
          console.log('Assinatura cancelada:', event.data.object);
          break;
        case 'invoice.payment_succeeded':
          console.log('Pagamento bem-sucedido:', event.data.object);
          break;
        case 'invoice.payment_failed':
          console.log('Falha no pagamento:', event.data.object);
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }

      return { success: true, event };
    } catch (error) {
      console.error('Erro no webhook:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();