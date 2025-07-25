#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
  });
}

async function setupIntegration() {
  log('\n🚀 FIKA - SETUP DE INTEGRAÇÃO COMPLETA', 'bright');
  log('=====================================\n', 'bright');

  try {
    // 1. Verificar dependências
    log('📦 Verificando dependências...', 'yellow');
    
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json não encontrado!');
    }

    if (!fs.existsSync('node_modules')) {
      log('📥 Instalando dependências...', 'blue');
      execSync('npm install', { stdio: 'inherit' });
    }

    log('✅ Dependências verificadas!', 'green');

    // 2. Configurar variáveis de ambiente
    log('\n🔧 Configurando variáveis de ambiente...', 'yellow');
    
    const envConfig = {};

    // Supabase
    log('\n📊 CONFIGURAÇÃO DO SUPABASE:', 'magenta');
    envConfig.SUPABASE_URL = await question('URL do projeto Supabase: ');
    envConfig.SUPABASE_ANON_KEY = await question('Chave anônima do Supabase: ');
    envConfig.SUPABASE_SERVICE_ROLE_KEY = await question('Chave service role do Supabase: ');

    // Stripe
    log('\n💳 CONFIGURAÇÃO DO STRIPE:', 'magenta');
    envConfig.STRIPE_PUBLISHABLE_KEY = await question('Chave pública do Stripe: ');
    envConfig.STRIPE_SECRET_KEY = await question('Chave secreta do Stripe: ');
    envConfig.STRIPE_WEBHOOK_SECRET = await question('Secret do webhook Stripe: ');

    // Configurações da aplicação
    log('\n⚙️ CONFIGURAÇÕES DA APLICAÇÃO:', 'magenta');
    envConfig.NODE_ENV = 'development';
    envConfig.PORT = '8000';
    envConfig.FRONTEND_URL = await question('URL do frontend (ex: https://meuapp.vercel.app): ') || 'http://localhost:8000';
    envConfig.JWT_SECRET = generateJWTSecret();

    // Salvar arquivo .env
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync('.env', envContent);
    log('✅ Arquivo .env criado!', 'green');

    // 3. Configurar Supabase
    log('\n🗄️ Configurando Supabase...', 'yellow');
    await setupSupabase(envConfig);

    // 4. Configurar Stripe
    log('\n💰 Configurando Stripe...', 'yellow');
    await setupStripe(envConfig);

    // 5. Preparar para deploy
    log('\n🌐 Preparando para deploy...', 'yellow');
    await setupDeploy();

    // 6. Testar integração
    log('\n🧪 Testando integração...', 'yellow');
    await testIntegration();

    log('\n🎉 INTEGRAÇÃO COMPLETA FINALIZADA!', 'green');
    log('=====================================', 'green');
    log('\n📋 PRÓXIMOS PASSOS:', 'bright');
    log('1. Execute: npm start', 'cyan');
    log('2. Acesse: http://localhost:8000', 'cyan');
    log('3. Para deploy: npm run deploy', 'cyan');
    log('\n📚 Documentação completa em: DEPLOY.md', 'blue');

  } catch (error) {
    log(`\n❌ Erro durante o setup: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

function generateJWTSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function setupSupabase(config) {
  log('📊 Criando tabelas no Supabase...', 'blue');
  
  // Verificar se o schema existe
  if (fs.existsSync('supabase-schema.sql')) {
    log('✅ Schema SQL encontrado!', 'green');
    log('📝 Execute o arquivo supabase-schema.sql no SQL Editor do Supabase', 'cyan');
  } else {
    log('⚠️ Arquivo supabase-schema.sql não encontrado', 'yellow');
  }

  // Configurar storage
  log('📁 Configurando storage para fotos...', 'blue');
  log('📝 Crie um bucket "user-photos" no Supabase Storage', 'cyan');
  log('📝 Configure as políticas de acesso conforme DEPLOY.md', 'cyan');
}

async function setupStripe(config) {
  log('💳 Configurando produtos no Stripe...', 'blue');
  
  const createProducts = await question('Deseja criar produtos automaticamente no Stripe? (y/n): ');
  
  if (createProducts.toLowerCase() === 'y') {
    try {
      const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
      
      // Criar produto
      const product = await stripe.products.create({
        name: 'Fika Premium',
        description: 'Acesso premium ao Fika com recursos exclusivos'
      });

      // Criar preços
      const monthlyPrice = await stripe.prices.create({
        unit_amount: 1999, // R$ 19,99
        currency: 'brl',
        recurring: { interval: 'month' },
        product: product.id,
        nickname: 'Premium Mensal'
      });

      const yearlyPrice = await stripe.prices.create({
        unit_amount: 19999, // R$ 199,99
        currency: 'brl',
        recurring: { interval: 'year' },
        product: product.id,
        nickname: 'Premium Anual'
      });

      // Atualizar .env com IDs dos preços
      const envContent = fs.readFileSync('.env', 'utf8');
      const updatedEnv = envContent + 
        `\nSTRIPE_PRICE_MONTHLY=${monthlyPrice.id}` +
        `\nSTRIPE_PRICE_YEARLY=${yearlyPrice.id}`;
      
      fs.writeFileSync('.env', updatedEnv);

      log('✅ Produtos criados no Stripe!', 'green');
      log(`📝 Preço mensal: ${monthlyPrice.id}`, 'cyan');
      log(`📝 Preço anual: ${yearlyPrice.id}`, 'cyan');

    } catch (error) {
      log(`⚠️ Erro ao criar produtos: ${error.message}`, 'yellow');
      log('📝 Configure manualmente no dashboard do Stripe', 'cyan');
    }
  }

  log('🔗 Configure o webhook no Stripe:', 'cyan');
  log(`📝 URL: ${config.FRONTEND_URL}/api/stripe/webhook`, 'cyan');
  log('📝 Eventos: checkout.session.completed, customer.subscription.deleted', 'cyan');
}

async function setupDeploy() {
  log('🌐 Configurando deploy...', 'blue');
  
  // Verificar se Vercel CLI está instalado
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log('✅ Vercel CLI encontrado!', 'green');
  } catch (error) {
    log('📥 Instalando Vercel CLI...', 'blue');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Criar script de deploy
  const deployScript = `#!/bin/bash
echo "🚀 Fazendo deploy do Fika..."
vercel --prod
echo "✅ Deploy concluído!"
`;

  fs.writeFileSync('deploy.sh', deployScript);
  
  // Atualizar package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.scripts.deploy = 'vercel --prod';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  log('✅ Scripts de deploy configurados!', 'green');
}

async function testIntegration() {
  log('🧪 Testando conexões...', 'blue');
  
  try {
    // Testar Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    await supabase.from('profiles').select('count').limit(1);
    log('✅ Conexão com Supabase OK!', 'green');
  } catch (error) {
    log('⚠️ Erro na conexão com Supabase', 'yellow');
  }

  try {
    // Testar Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.products.list({ limit: 1 });
    log('✅ Conexão com Stripe OK!', 'green');
  } catch (error) {
    log('⚠️ Erro na conexão com Stripe', 'yellow');
  }
}

// Executar setup
if (require.main === module) {
  setupIntegration();
}

module.exports = { setupIntegration };