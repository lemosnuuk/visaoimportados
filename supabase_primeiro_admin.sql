-- ==============================================================================
-- IMPLANTAÇÃO MANUAL DO PRIMEIRO ADMINISTRADOR E VALIDAÇÃO DE ESTADO
-- ==============================================================================
-- 1. Substitua '<COLE-AQUI-O-SEU-UUID>' pelo UUID real do seu usuário (auth.users)
-- 2. Execute via Supabase SQL Editor.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_admin_uuid UUID := '<COLE-AQUI-O-SEU-UUID>'::UUID; -- Exemplo: '123e4567-e89b-12d3-a456-426614174000'
    v_user_exists BOOLEAN;
    v_is_admin_check BOOLEAN;
BEGIN
    -- 1. Valida se o UUID informado existe na tabela auth.users do Supabase
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = v_admin_uuid
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'ABORTADO: O UUID informado não existe na tabela auth.users. Verifique a chave antes de prosseguir.';
    END IF;

    -- 2. Insere o administrador (ON CONFLICT DO NOTHING para evitar erros se já for admin)
    INSERT INTO public.admin_users (user_id) 
    VALUES (v_admin_uuid)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Confirmação teórica de que o sistema de roles funcionaria.
    -- (Neste contexto anônimo do bloco DO, auth.uid() é nulo, então não podemos chamar private.is_admin diretamente. 
    -- Mas verificamos se o registro está na tabela admin_users).
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = v_admin_uuid
    ) INTO v_is_admin_check;

    IF NOT v_is_admin_check THEN
        RAISE EXCEPTION 'ABORTADO: Falha crítica na gravação do administrador.';
    END IF;

    RAISE NOTICE 'SUCESSO: Administrador validado e criado com segurança.';
END $$;

COMMIT;
