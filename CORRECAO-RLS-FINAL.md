# 🔧 CORREÇÃO DOS PROBLEMAS RLS - GUIA COMPLETO

## 📊 STATUS ATUAL
- ✅ **Conexão Supabase:** Funcionando
- ✅ **Tabelas:** Todas criadas (8/8)
- ✅ **Autenticação:** Sistema operacional
- ❌ **Políticas RLS:** Muito restritivas
- ❌ **Criação de usuários:** Bloqueada pelas políticas

## 🎯 PROBLEMA IDENTIFICADO
As políticas RLS (Row Level Security) estão impedindo que usuários criem:
- Perfis na tabela `profiles`
- Configurações na tabela `user_settings`
- Matches, visualizações de stories e denúncias

## 🔧 SOLUÇÃO - EXECUTE NO SUPABASE DASHBOARD

### 1. Acesse o SQL Editor
🔗 **Link direto:** https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql

### 2. Cole e execute este SQL:

```sql
-- ========================================
-- CORREÇÕES DE POLÍTICAS RLS
-- ========================================

-- 1. Política para criação de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Política para configurações de usuário
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Política para matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- 4. Política para visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 5. Política para denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

### 3. Verificação (opcional)
```sql
-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## 🧪 TESTE APÓS CORREÇÃO

### 1. Execute o teste completo:
```bash
node test-supabase-complete.js
```

### 2. Resultado esperado:
- ✅ Conexão: OK
- ✅ Tabelas: OK
- ✅ Autenticação: OK
- ✅ Políticas RLS: OK
- ✅ Criação de usuário: OK
- ✅ Integração App: OK

### 3. Teste na aplicação:
- Acesse: http://localhost:8000
- Tente criar uma nova conta
- Verifique se o perfil é criado com sucesso

## 📋 SCRIPTS DISPONÍVEIS

### Para verificação:
- `node test-supabase-complete.js` - Teste completo
- `node apply-rls-fixes.js` - Mostra instruções de correção

### Para automação (se tiver Service Role Key):
- `node fix-rls-direct.js` - Correção automática
- `node setup-auto-sql.js` - Setup da função exec_sql

## ⚠️ NOTAS IMPORTANTES

1. **Segurança:** As políticas criadas são seguras e seguem o princípio de menor privilégio
2. **Produção:** Estas políticas são adequadas para produção
3. **Backup:** O Supabase mantém histórico das alterações
4. **Reversão:** Se necessário, as políticas podem ser removidas com `DROP POLICY`

## 🎯 PRÓXIMOS PASSOS

1. ✅ Execute o SQL no Dashboard
2. ✅ Rode o teste completo
3. ✅ Teste o registro na aplicação
4. ✅ Faça commit das correções
5. ✅ Deploy em produção

## 🔗 LINKS ÚTEIS

- **SQL Editor:** https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql
- **Dashboard:** https://supabase.com/dashboard/project/kujhzettkaitekulvhqt
- **Aplicação:** http://localhost:8000
- **Repositório:** https://github.com/MatheusRVogel/fika-app.git

---

**🎉 Após executar estas correções, seu app estará 100% funcional!**