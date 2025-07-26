# 🔧 CORREÇÃO URGENTE - Políticas RLS do Supabase

## ❌ PROBLEMA IDENTIFICADO
As políticas de segurança RLS (Row Level Security) estão impedindo a criação de novos usuários.

**Erro específico:** `new row violates row-level security policy for table "profiles"`

## ✅ SOLUÇÃO - Execute no SQL Editor do Supabase

### 1. Acesse o SQL Editor
🔗 **Link direto:** https://supabase.com/dashboard/project/kujhzettkaitekulvhqt/sql

### 2. Cole e execute este SQL:

```sql
-- CORREÇÃO DAS POLÍTICAS RLS

-- 1. Adicionar política para permitir inserção de perfis
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Adicionar política para permitir inserção de configurações
CREATE POLICY "Usuários podem criar próprias configurações" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Adicionar política para permitir criação de matches
CREATE POLICY "Sistema pode criar matches" ON matches
    FOR INSERT WITH CHECK (true);

-- 4. Adicionar política para visualizações de stories
CREATE POLICY "Usuários podem visualizar stories" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 5. Adicionar política para denúncias
CREATE POLICY "Usuários podem fazer denúncias" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 6. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### 3. Verificar se funcionou
Após executar o SQL acima, execute este comando para testar:

```bash
node test-supabase.js
```

## 📋 O QUE CADA POLÍTICA FAZ

1. **profiles INSERT**: Permite que usuários criem seu próprio perfil
2. **user_settings INSERT**: Permite que usuários criem suas configurações
3. **matches INSERT**: Permite que o sistema crie matches automaticamente
4. **story_views INSERT**: Permite que usuários visualizem stories
5. **reports INSERT**: Permite que usuários façam denúncias

## 🚨 IMPORTANTE
- Execute EXATAMENTE como está escrito
- Não pule nenhuma linha
- Se der erro "policy already exists", ignore e continue
- Teste sempre após aplicar as correções

## 🔍 COMO VERIFICAR SE FUNCIONOU
Após aplicar as correções, você deve ver:
- ✅ Usuário criado com sucesso
- ✅ Perfil criado com sucesso  
- ✅ Configurações criadas com sucesso

## 📞 SUPORTE
Se ainda houver problemas, verifique:
1. Se todas as tabelas existem
2. Se o RLS está habilitado
3. Se as políticas foram criadas corretamente