const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const supabaseService = require('./supabase-service');
const stripeService = require('./stripe-service');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", process.env.SUPABASE_URL],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://vercel.app', 'https://*.vercel.app']
    : ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use('/api/', limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos sem cache
app.use(express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Rotas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// API Routes - Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, bio } = req.body;
    
    if (!email || !password || !name || !age) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    const result = await supabaseService.registerUser(email, password, {
      name,
      age: parseInt(age),
      bio: bio || ''
    });

    res.json(result);
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await supabaseService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Routes - User Profile
app.get('/api/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await supabaseService.getUserProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const result = await supabaseService.updateUserProfile(userId, updates);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Routes - Explore/Matching
app.get('/api/explore/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const users = await supabaseService.exploreUsers(userId, parseInt(limit), parseInt(offset));
    res.json(users);
  } catch (error) {
    console.error('Erro ao explorar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/like', async (req, res) => {
  try {
    const { userId, likedUserId } = req.body;
    
    if (!userId || !likedUserId) {
      return res.status(400).json({ error: 'IDs de usuário são obrigatórios' });
    }

    const result = await supabaseService.likeUser(userId, likedUserId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao curtir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/matches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const matches = await supabaseService.getMatches(userId);
    res.json(matches);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Routes - Messages
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content, type = 'text' } = req.body;
    
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'Dados da mensagem são obrigatórios' });
    }

    const result = await supabaseService.sendMessage(senderId, receiverId, content, type);
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await supabaseService.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await supabaseService.getMessages(userId, otherUserId, parseInt(limit), parseInt(offset));
    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Routes - Stripe/Premium
app.get('/api/stripe/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;
    
    if (!userId || !priceId) {
      return res.status(400).json({ error: 'UserId e priceId são obrigatórios' });
    }

    const session = await stripeService.createCheckoutSession(
      userId, 
      priceId, 
      successUrl || `${req.headers.origin}/app?premium=success`,
      cancelUrl || `${req.headers.origin}/app?premium=cancel`
    );
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/stripe/subscription-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await stripeService.getSubscriptionStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/stripe/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'UserId é obrigatório' });
    }

    const result = await stripeService.cancelSubscription(userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook do Stripe
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await stripeService.handleWebhook(req.body, sig);
    res.json(result);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// API Routes - Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch-all para SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint não encontrado' });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 App: http://localhost:${PORT}/app`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`🏠 Landing: http://localhost:${PORT}/`);
});

module.exports = app;