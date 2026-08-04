-- ==============================================================================
-- PREFLIGHT DE SEGURANÇA (SOMENTE LEITURA)
-- Objetivo: Inventariar o estado real de produção sem alterar nenhum dado.
-- Execute no Supabase SQL Editor antes de rodar a Migration de Segurança.
-- ==============================================================================

-- 1. TABELAS E COLUNAS DA VITRINE (Para conferir quais colunas públicas serão expostas)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'categories', 'campaigns', 'campaign_products', 'product_images')
ORDER BY table_name, ordinal_position;

-- 2. TABELAS E COLUNAS ADMINISTRATIVAS/FINANCEIRAS (Para conferir estado de colunas sensíveis)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'product_movements', 'movement_payments')
ORDER BY table_name, ordinal_position;

-- 3. STATUS DA RLS (Quais tabelas estão com RLS ativada ou desativada)
SELECT relname AS table_name, rowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND relkind = 'r'
ORDER BY relname;

-- 4. INVENTÁRIO DE TODAS AS POLICIES REAIS (Para comparar com o script de rollback/drop)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- 5. GRANTS DE TABELAS (Permissões de banco para anon e authenticated)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, grantee;

-- 6. VIEWS E FUNÇÕES PÚBLICAS
SELECT routine_schema, routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE specific_schema IN ('public', 'private')
ORDER BY routine_name;

-- 7. TRIGGERS E FUNÇÕES EXECUTADAS
SELECT trigger_schema, event_object_table, trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 8. CONFIGURAÇÕES DE STORAGE E BUCKETS
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- 9. POLICIES DO STORAGE.OBJECTS
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
