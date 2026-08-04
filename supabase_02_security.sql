-- MIGRAÇÃO DE SEGURANÇA E AUTORIZAÇÃO (VISÃO IMPORTADOS)
-- Este arquivo deve ser executado via Supabase SQL Editor. 
-- NÃO apaga tabelas, colunas nem dados comerciais. Apenas substitui policies.

BEGIN;

-- 1. CRIAR SCHEMA PRIVADO (SE NÃO EXISTIR) PARA FUNÇÕES ADMINISTRATIVAS
CREATE SCHEMA IF NOT EXISTS private;

-- 2. CRIAR TABELA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS na tabela de admins explicitamente
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy da tabela de admins (Permite que o user verifique seu próprio status no backend/middleware)
DROP POLICY IF EXISTS "Leitura do proprio status de admin" ON public.admin_users;
CREATE POLICY "Leitura do proprio status de admin" ON public.admin_users
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. FUNÇÃO SEGURA PARA VERIFICAÇÃO DE ADMIN (Restrita)
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER 
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- Revogar acesso indevido à função
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- ==========================================
-- 4. DROPS DE POLICIES ANTIGAS (INSEGURAS)
-- As policies antigas vulneráveis (listadas pelo preflight) são removidas.
-- ==========================================
DROP POLICY IF EXISTS "Permitir leitura publica de categorias" ON public.categories;
DROP POLICY IF EXISTS "Permitir controle total de categorias para admins" ON public.categories;
DROP POLICY IF EXISTS "Permitir leitura publica de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir controle total de produtos para admins" ON public.products;
DROP POLICY IF EXISTS "Permitir leitura publica de imagens" ON public.product_images;
DROP POLICY IF EXISTS "Permitir controle total de imagens para admins" ON public.product_images;
DROP POLICY IF EXISTS "Permitir upload de imagens para admins" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizacao de imagens para admins" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusao de imagens para admins" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica de imagens do bucket" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de campanhas" ON public.campaigns;
DROP POLICY IF EXISTS "Permitir gerencimento de campanhas para admins" ON public.campaigns;
DROP POLICY IF EXISTS "Permitir leitura pública de produtos da campanha" ON public.campaign_products;
DROP POLICY IF EXISTS "Permitir gerencimento de produtos da campanha para admins" ON public.campaign_products;
DROP POLICY IF EXISTS "Permitir leitura pública de pagamentos da movimentação" ON public.movement_payments;
DROP POLICY IF EXISTS "Permitir gerencimento de pagamentos para admins" ON public.movement_payments;
DROP POLICY IF EXISTS "Permitir leitura publica de clientes" ON public.customers;
DROP POLICY IF EXISTS "Permitir gerencimento de clientes para admins" ON public.customers;
DROP POLICY IF EXISTS "Permitir leitura publica de movimentacoes" ON public.product_movements;
DROP POLICY IF EXISTS "Permitir gerencimento de movimentacoes" ON public.product_movements;
DROP POLICY IF EXISTS "Permitir gerencimento de movimentacoes para admins" ON public.product_movements;

-- ==========================================
-- 5. CRIAÇÃO DAS NOVAS POLICIES (SEGURAS)
-- ==========================================

-- Garante RLS ativa nas tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_movements ENABLE ROW LEVEL SECURITY;

-- A. DADOS PÚBLICOS (VITRINE) - Leitura para todos, Escrita SÓ PARA ADMINS
CREATE POLICY "Leitura publica categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin CRUD categorias" ON public.categories FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Leitura publica produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin CRUD produtos" ON public.products FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Leitura publica imagens" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admin CRUD imagens" ON public.product_images FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Leitura publica campanhas" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Admin CRUD campanhas" ON public.campaigns FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Leitura publica campaign_products" ON public.campaign_products FOR SELECT USING (true);
CREATE POLICY "Admin CRUD campaign_products" ON public.campaign_products FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- B. DADOS PRIVADOS E LGPD - Leitura e Escrita SÓ PARA ADMINS (Bloqueio Total Externo)
CREATE POLICY "Admin CRUD clientes" ON public.customers FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admin CRUD movement_payments" ON public.movement_payments FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admin CRUD product_movements" ON public.product_movements FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- C. STORAGE (BUCKET) - Arquivos Estáticos (Limitado a Imagens Comerciais)
-- Se a policy existir, não vai falhar se usarmos OR REPLACE (infelizmente Postgres policies não tem CREATE OR REPLACE, por isso foi feito DROP acima)
CREATE POLICY "Leitura publica bucket imagens" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin Insert bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND private.is_admin());
CREATE POLICY "Admin Update bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND private.is_admin()) WITH CHECK (bucket_id = 'product-images' AND private.is_admin());
CREATE POLICY "Admin Delete bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND private.is_admin());

COMMIT;
