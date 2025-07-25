// Função serverless para Vercel
try {
  // Configurar variáveis de ambiente
  require('dotenv').config();
  
  // Verificar variáveis essenciais
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Variáveis de ambiente faltando:', missingVars);
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`);
  }
  
  // Importar e exportar o app
  const app = require('../server.js');
  module.exports = app;
  
} catch (error) {
  console.error('Erro ao inicializar função serverless:', error);
  
  // Exportar função de erro como fallback
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Erro de inicialização do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  };
}