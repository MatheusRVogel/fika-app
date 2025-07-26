#!/usr/bin/env node

// 🚀 SCRIPT DE DEPLOY AUTOMÁTICO PARA VERCEL
// Execute: node deploy-vercel.js

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 INICIANDO DEPLOY AUTOMÁTICO NO VERCEL...\n');

function runCommand(command, description) {
    console.log(`📋 ${description}...`);
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} - Sucesso!`);
        return output;
    } catch (error) {
        console.log(`❌ ${description} - Erro:`, error.message);
        return null;
    }
}

function checkVercelCLI() {
    console.log('🔍 Verificando Vercel CLI...');
    try {
        execSync('vercel --version', { stdio: 'pipe' });
        console.log('✅ Vercel CLI encontrado!');
        return true;
    } catch (error) {
        console.log('❌ Vercel CLI não encontrado!');
        console.log('💡 Instale com: npm i -g vercel');
        return false;
    }
}

async function main() {
    // 1. Verificar se Vercel CLI está instalado
    if (!checkVercelCLI()) {
        console.log('\n🔧 INSTALANDO VERCEL CLI...');
        runCommand('npm install -g vercel', 'Instalando Vercel CLI');
    }

    // 2. Verificar se já está logado no Vercel
    console.log('\n🔐 Verificando login no Vercel...');
    const whoami = runCommand('vercel whoami', 'Verificando usuário logado');
    
    if (!whoami) {
        console.log('🔑 Fazendo login no Vercel...');
        console.log('💡 Uma página do navegador será aberta para login');
        runCommand('vercel login', 'Login no Vercel');
    }

    // 3. Fazer deploy
    console.log('\n🚀 FAZENDO DEPLOY...');
    const deployOutput = runCommand('vercel --prod', 'Deploy para produção');
    
    if (deployOutput) {
        console.log('\n🎉 DEPLOY REALIZADO COM SUCESSO!');
        console.log('📋 Informações do deploy:');
        console.log(deployOutput);
        
        // Extrair URL do deploy
        const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
            const deployUrl = urlMatch[0];
            console.log(`\n🌐 URL da aplicação: ${deployUrl}`);
            
            // Salvar URL no arquivo
            fs.writeFileSync('DEPLOY-URL.txt', `URL da aplicação: ${deployUrl}\nDeploy realizado em: ${new Date().toISOString()}`);
            console.log('📄 URL salva em DEPLOY-URL.txt');
        }
    }

    console.log('\n✅ PROCESSO DE DEPLOY CONCLUÍDO!');
    console.log('📋 Próximos passos:');
    console.log('   1. Teste a aplicação na URL de produção');
    console.log('   2. Verifique se o Supabase está funcionando');
    console.log('   3. Teste registro e login');
    console.log('   4. Configure domínio personalizado (opcional)');
}

main().catch(console.error);