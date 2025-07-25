# Guia de Deploy - Fika Dating App

## 📋 Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **Conta no Supabase** (https://supabase.com)
3. **Conta no Stripe** (https://stripe.com)
4. **Conta no Vercel** (https://vercel.com) ou outra hospedagem

## 🚀 Configuração do Supabase

### 1. Criar Projeto
1. Acesse https://supabase.com
2. Clique em "New Project"
3. Escolha organização e nome do projeto
4. Defina senha do banco de dados
5. Selecione região (preferencialmente São Paulo)

### 2. Configurar Banco de Dados
1. No painel do Supabase, vá em "SQL Editor"
2. Execute o script `supabase-schema.sql` para criar as tabelas
3. Vá em "Authentication" > "Settings" > "Auth Providers"
4. Configure provedores de login (Google, Facebook, etc.)

### 3. Configurar Storage (para fotos)
1. Vá em "Storage"
2. Crie um bucket chamado "user-photos"
3. Configure políticas de acesso:
```sql
-- Política para upload de fotos
CREATE POLICY "Usuários podem fazer upload de fotos" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Política para visualizar fotos
CREATE POLICY "Fotos são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'user-photos');
```

### 4. Obter Chaves
1. Vá em "Settings" > "API"
2. Copie:
   - Project URL
   - Anon public key
   - Service role key (para operações administrativas)

## 💳 Configuração do Stripe

### 1. Criar Conta
1. Acesse https://stripe.com
2. Crie conta e complete verificação
3. Ative modo de produção quando estiver pronto

### 2. Configurar Produtos
1. No dashboard, vá em "Products"
2. Crie produto "Fika Premium"
3. Adicione preços:
   - Mensal: R$ 19,99
   - Anual: R$ 199,99 (com desconto)

### 3. Configurar Webhooks
1. Vá em "Developers" > "Webhooks"
2. Adicione endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 4. Obter Chaves
1. Vá em "Developers" > "API keys"
2. Copie:
   - Publishable key
   - Secret key
   - Webhook secret

## 🌐 Deploy no Vercel

### 1. Preparar Projeto
```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `.env` com suas chaves:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave
STRIPE_SECRET_KEY=sk_live_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_sua_chave
```

### 3. Deploy
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 4. Configurar Variáveis no Vercel
1. No dashboard do Vercel, vá no seu projeto
2. Vá em "Settings" > "Environment Variables"
3. Adicione todas as variáveis do arquivo `.env`

## 🔧 Outras Opções de Hospedagem

### Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### Heroku
```bash
# Instalar Heroku CLI
# Criar app
heroku create seu-app-name

# Configurar variáveis
heroku config:set SUPABASE_URL=sua_url
heroku config:set SUPABASE_ANON_KEY=sua_chave

# Deploy
git push heroku main
```

### DigitalOcean App Platform
1. Conecte seu repositório GitHub
2. Configure variáveis de ambiente
3. Deploy automático

## 📱 Configuração do Frontend

### 1. Atualizar URLs
No arquivo `script.js`, atualize:
```javascript
const API_BASE_URL = 'https://seu-dominio.com/api';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_sua_chave';
```

### 2. Configurar Supabase no Frontend
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://seu-projeto.supabase.co'
const supabaseKey = 'sua_chave_anon'
const supabase = createClient(supabaseUrl, supabaseKey)
```

## 🔒 Segurança

### 1. CORS
Configure CORS no servidor para permitir apenas seu domínio:
```javascript
app.use(cors({
  origin: ['https://seu-dominio.com', 'https://www.seu-dominio.com']
}));
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});

app.use('/api/', limiter);
```

### 3. Validação de Dados
Use bibliotecas como Joi ou Yup para validar dados de entrada.

## 📊 Monitoramento

### 1. Logs
Configure logs com Winston ou similar:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Analytics
Integre Google Analytics ou Mixpanel para acompanhar uso.

## 🚨 Backup

### 1. Banco de Dados
Configure backups automáticos no Supabase:
1. Vá em "Settings" > "Database"
2. Configure backup automático

### 2. Arquivos
Configure backup do storage no Supabase ou use serviços como AWS S3.

## 📞 Suporte

Para dúvidas:
1. Documentação do Supabase: https://supabase.com/docs
2. Documentação do Stripe: https://stripe.com/docs
3. Documentação do Vercel: https://vercel.com/docs

## 🔄 Atualizações

Para atualizar o app:
```bash
# Fazer alterações no código
git add .
git commit -m "Atualização"
git push

# Vercel fará deploy automático
# Ou execute: vercel --prod
```