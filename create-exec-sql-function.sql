-- Função customizada para executar SQL dinamicamente
-- ATENÇÃO: Use apenas em desenvolvimento, nunca em produção!

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Verificar se o usuário tem permissão (opcional)
    -- IF NOT auth.uid() IS NOT NULL THEN
    --     RAISE EXCEPTION 'Acesso negado';
    -- END IF;
    
    -- Executar o SQL
    EXECUTE sql_query;
    
    -- Retornar sucesso
    result := json_build_object(
        'success', true,
        'message', 'SQL executado com sucesso',
        'query', sql_query
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Retornar erro
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'query', sql_query
    );
    
    RETURN result;
END;
$$;

-- Dar permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;