#!/usr/bin/env node

/**
 * Script de Validação da Integração Completa
 * Testa Supabase, Stripe e todas as funcionalidades da API
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'bold');
  console.log('='.repeat(50));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Carregar variáveis de ambiente
require('dotenv').config();

class IntegrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  // Validar arquivos essenciais
  validateFiles() {
    logSection('📁 VALIDAÇÃO DE ARQUIVOS');
    
    const requiredFiles = [
      'package.json',
      'server.js',
      'supabase-service.js',
      'stripe-service.js',
      'fikah-api.js',
      'index.html',
      'app.js',
      'app.css',
      '.env',
      'vercel.json'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        logSuccess(`${file} encontrado`);
        this.successes.push(`Arquivo ${file} existe`);
      } else {
        logError(`${file} não encontrado`);
        this.errors.push(`Arquivo ${file} não encontrado`);
      }
    });
  }

  // Validar variáveis de ambiente
  validateEnvironment() {
    logSection('🔧 VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE');
    
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID_MONTHLY',
      'STRIPE_PRICE_ID_YEARLY',
      'JWT_SECRET',
      'FRONTEND_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        if (process.env[envVar].includes('your_') || process.env[envVar].includes('sk_test_') === false && envVar.includes('STRIPE')) {
          logWarning(`${envVar} parece ser um placeholder`);
          this.warnings.push(`${envVar} pode precisar de valor real`);
        } else {
          logSuccess(`${envVar} configurado`);
          this.successes.push(`${envVar} configurado`);
        }
      } else {
        logError(`${envVar} não encontrado`);
        this.errors.push(`${envVar} não configurado`);
      }
    });
  }

  // Testar conexão com Supabase
  async testSupabaseConnection() {
    logSection('🗄️  TESTE DE CONEXÃO SUPABASE');
    
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        logError('Credenciais do Supabase não configuradas');
        this.errors.push('Supabase não configurado');
        return;
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Testar conexão básica
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        if (error.message.includes('relation "users" does not exist')) {
          logWarning('Tabela users não existe - precisa executar migrations');
          this.warnings.push('Tabela users não encontrada');
        } else {
          logError(`Erro na conexão: ${error.message}`);
          this.errors.push(`Supabase: ${error.message}`);
        }
      } else {
        logSuccess('Conexão com Supabase estabelecida');
        this.successes.push('Supabase conectado');
      }

    } catch (error) {
      logError(`Erro ao testar Supabase: ${error.message}`);
      this.errors.push(`Supabase: ${error.message}`);
    }
  }

  // Testar conexão com Stripe
  async testStripeConnection() {
    logSection('💳 TESTE DE CONEXÃO STRIPE');
    
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        logError('Chave secreta do Stripe não configurada');
        this.errors.push('Stripe não configurado');
        return;
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      // Testar conexão básica
      const account = await stripe.accounts.retrieve();
      
      logSuccess(`Conectado ao Stripe - Conta: ${account.id}`);
      this.successes.push('Stripe conectado');

      // Verificar produtos configurados
      if (process.env.STRIPE_PRICE_ID_MONTHLY) {
        try {
          const monthlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_MONTHLY);
          logSuccess(`Preço mensal encontrado: ${monthlyPrice.unit_amount / 100} ${monthlyPrice.currency}`);
          this.successes.push('Preço mensal configurado');
        } catch (error) {
          logError(`Preço mensal inválido: ${error.message}`);
          this.errors.push('Preço mensal inválido');
        }
      }

      if (process.env.STRIPE_PRICE_ID_YEARLY) {
        try {
          const yearlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_YEARLY);
          logSuccess(`Preço anual encontrado: ${yearlyPrice.unit_amount / 100} ${yearlyPrice.currency}`);
          this.successes.push('Preço anual configurado');
        } catch (error) {
          logError(`Preço anual inválido: ${error.message}`);
          this.errors.push('Preço anual inválido');
        }
      }

    } catch (error) {
      logError(`Erro ao testar Stripe: ${error.message}`);
      this.errors.push(`Stripe: ${error.message}`);
    }
  }

  // Validar estrutura do package.json
  validatePackageJson() {
    logSection('📦 VALIDAÇÃO DO PACKAGE.JSON');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredDeps = [
        '@supabase/supabase-js',
        'stripe',
        'express',
        'cors',
        'helmet',
        'express-rate-limit',
        'dotenv',
        'bcryptjs',
        'jsonwebtoken'
      ];

      requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          logSuccess(`Dependência ${dep} encontrada`);
          this.successes.push(`Dependência ${dep} instalada`);
        } else {
          logError(`Dependência ${dep} não encontrada`);
          this.errors.push(`Dependência ${dep} faltando`);
        }
      });

      // Verificar scripts
      if (packageJson.scripts) {
        if (packageJson.scripts.start) {
          logSuccess('Script start configurado');
          this.successes.push('Script start existe');
        } else {
          logWarning('Script start não encontrado');
          this.warnings.push('Script start faltando');
        }

        if (packageJson.scripts.dev) {
          logSuccess('Script dev configurado');
          this.successes.push('Script dev existe');
        } else {
          logWarning('Script dev não encontrado');
          this.warnings.push('Script dev faltando');
        }
      }

    } catch (error) {
      logError(`Erro ao validar package.json: ${error.message}`);
      this.errors.push(`package.json: ${error.message}`);
    }
  }

  // Validar configuração do Vercel
  validateVercelConfig() {
    logSection('🚀 VALIDAÇÃO DA CONFIGURAÇÃO VERCEL');
    
    try {
      if (fs.existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        
        if (vercelConfig.functions) {
          logSuccess('Configuração de functions encontrada');
          this.successes.push('Vercel functions configurado');
        }

        if (vercelConfig.routes) {
          logSuccess('Configuração de routes encontrada');
          this.successes.push('Vercel routes configurado');
        }

        if (vercelConfig.env) {
          logSuccess('Configuração de env encontrada');
          this.successes.push('Vercel env configurado');
        }

      } else {
        logWarning('vercel.json não encontrado');
        this.warnings.push('Configuração Vercel faltando');
      }
    } catch (error) {
      logError(`Erro ao validar vercel.json: ${error.message}`);
      this.errors.push(`vercel.json: ${error.message}`);
    }
  }

  // Gerar relatório final
  generateReport() {
    logSection('📊 RELATÓRIO FINAL');
    
    console.log(`\n${colors.green}✅ Sucessos: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Avisos: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}❌ Erros: ${this.errors.length}${colors.reset}`);

    if (this.errors.length > 0) {
      console.log('\n' + colors.red + colors.bold + 'ERROS ENCONTRADOS:' + colors.reset);
      this.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n' + colors.yellow + colors.bold + 'AVISOS:' + colors.reset);
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length === 0) {
      logSuccess('🎉 INTEGRAÇÃO VALIDADA COM SUCESSO!');
      console.log('\nPróximos passos:');
      console.log('1. Execute: npm start');
      console.log('2. Acesse: http://localhost:8000');
      console.log('3. Teste as funcionalidades');
      console.log('4. Configure o deploy no Vercel');
    } else {
      logError('❌ INTEGRAÇÃO POSSUI ERROS');
      console.log('\nCorreja os erros listados acima antes de prosseguir.');
    }
  }

  // Executar todas as validações
  async run() {
    log('🔍 INICIANDO VALIDAÇÃO DA INTEGRAÇÃO COMPLETA\n', 'bold');
    
    this.validateFiles();
    this.validateEnvironment();
    this.validatePackageJson();
    this.validateVercelConfig();
    
    await this.testSupabaseConnection();
    await this.testStripeConnection();
    
    this.generateReport();
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new IntegrationValidator();
  validator.run().catch(error => {
    console.error('Erro durante validação:', error);
    process.exit(1);
  });
}

module.exports = IntegrationValidator;