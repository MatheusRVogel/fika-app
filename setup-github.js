#!/usr/bin/env node

/**
 * Script para Configurar GitHub e Deploy
 * Automatiza a criação do repositório e configuração
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function execCommand(command, description) {
  try {
    log(`Executando: ${description}`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(`${description} - Concluído`);
    return result;
  } catch (error) {
    logError(`${description} - Erro: ${error.message}`);
    throw error;
  }
}

class GitHubSetup {
  constructor() {
    this.projectName = 'fika-app';
  }

  // Verificar se Git está instalado
  checkGitInstallation() {
    logSection('🔍 VERIFICANDO INSTALAÇÕES');
    
    try {
      execCommand('git --version', 'Verificando Git');
    } catch (error) {
      logError('Git não está instalado. Instale em: https://git-scm.com/');
      process.exit(1);
    }

    try {
      execCommand('gh --version', 'Verificando GitHub CLI');
    } catch (error) {
      log('GitHub CLI não encontrado. Instalando...', 'yellow');
      log('Instale manualmente em: https://cli.github.com/', 'yellow');
      log('Ou continue com criação manual do repositório', 'yellow');
    }
  }

  // Criar .gitignore se não existir
  createGitignore() {
    logSection('📝 CONFIGURANDO .GITIGNORE');
    
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
.vercel/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`;

    if (!fs.existsSync('.gitignore')) {
      fs.writeFileSync('.gitignore', gitignoreContent);
      logSuccess('.gitignore criado');
    } else {
      logSuccess('.gitignore já existe');
    }
  }

  // Inicializar repositório Git
  initializeGit() {
    logSection('🔧 INICIALIZANDO GIT');
    
    if (!fs.existsSync('.git')) {
      execCommand('git init', 'Inicializando repositório Git');
      execCommand('git add .', 'Adicionando arquivos');
      execCommand('git commit -m "Initial commit: FIKA App with Supabase and Stripe integration"', 'Primeiro commit');
      logSuccess('Repositório Git inicializado');
    } else {
      logSuccess('Repositório Git já existe');
      
      // Verificar se há mudanças para commit
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
          execCommand('git add .', 'Adicionando mudanças');
          execCommand('git commit -m "Update: Latest integration changes"', 'Commit das mudanças');
        }
      } catch (error) {
        log('Nenhuma mudança para commit', 'yellow');
      }
    }
  }

  // Instruções para GitHub
  showGitHubInstructions() {
    logSection('📚 INSTRUÇÕES PARA GITHUB');
    
    console.log(`
${colors.bold}OPÇÃO 1: GitHub CLI (Automático)${colors.reset}
${colors.blue}1.${colors.reset} gh auth login
${colors.blue}2.${colors.reset} gh repo create ${this.projectName} --public --push --source=.

${colors.bold}OPÇÃO 2: Interface Web (Manual)${colors.reset}
${colors.blue}1.${colors.reset} Acesse: https://github.com/new
${colors.blue}2.${colors.reset} Nome do repositório: ${this.projectName}
${colors.blue}3.${colors.reset} Marque como Público
${colors.blue}4.${colors.reset} NÃO inicialize com README (já temos arquivos)
${colors.blue}5.${colors.reset} Clique em "Create repository"
${colors.blue}6.${colors.reset} Execute os comandos mostrados na tela:

   git remote add origin https://github.com/SEU_USUARIO/${this.projectName}.git
   git branch -M main
   git push -u origin main

${colors.bold}OPÇÃO 3: Deploy Direto no Vercel (Sem GitHub)${colors.reset}
${colors.blue}1.${colors.reset} npm install -g vercel
${colors.blue}2.${colors.reset} vercel login
${colors.blue}3.${colors.reset} vercel --prod
`);
  }

  // Verificar configuração do Vercel
  showVercelInstructions() {
    logSection('🚀 CONFIGURAÇÃO DO VERCEL');
    
    console.log(`
${colors.bold}DEPOIS DE CRIAR O REPOSITÓRIO GITHUB:${colors.reset}

${colors.blue}1.${colors.reset} Acesse: https://vercel.com/new
${colors.blue}2.${colors.reset} Conecte sua conta GitHub
${colors.blue}3.${colors.reset} Selecione o repositório: ${this.projectName}
${colors.blue}4.${colors.reset} Configure as variáveis de ambiente:

   ${colors.yellow}SUPABASE_URL${colors.reset}=https://seu-projeto.supabase.co
   ${colors.yellow}SUPABASE_ANON_KEY${colors.reset}=sua_chave_anonima
   ${colors.yellow}SUPABASE_SERVICE_ROLE_KEY${colors.reset}=sua_chave_service_role
   ${colors.yellow}STRIPE_PUBLISHABLE_KEY${colors.reset}=pk_test_sua_chave
   ${colors.yellow}STRIPE_SECRET_KEY${colors.reset}=sk_test_sua_chave
   ${colors.yellow}STRIPE_WEBHOOK_SECRET${colors.reset}=whsec_sua_chave
   ${colors.yellow}STRIPE_PRICE_ID_MONTHLY${colors.reset}=price_id_mensal
   ${colors.yellow}STRIPE_PRICE_ID_YEARLY${colors.reset}=price_id_anual
   ${colors.yellow}JWT_SECRET${colors.reset}=sua_chave_jwt_secreta
   ${colors.yellow}FRONTEND_URL${colors.reset}=https://seu-app.vercel.app

${colors.blue}5.${colors.reset} Clique em "Deploy"
${colors.blue}6.${colors.reset} Aguarde o build e deploy automático

${colors.green}✅ VANTAGENS DO GITHUB + VERCEL:${colors.reset}
• Deploy automático a cada push
• Preview de branches
• Rollback fácil
• Colaboração em equipe
• Backup seguro do código
`);
  }

  // Executar setup completo
  run() {
    log('🚀 CONFIGURANDO GITHUB E DEPLOY\n', 'bold');
    
    this.checkGitInstallation();
    this.createGitignore();
    this.initializeGit();
    this.showGitHubInstructions();
    this.showVercelInstructions();
    
    logSection('🎉 SETUP CONCLUÍDO');
    log('Escolha uma das opções acima para continuar!', 'green');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new GitHubSetup();
  setup.run();
}

module.exports = GitHubSetup;