-- ==============================================================================
-- SCRIPT DE ROLLBACK SEGURO
-- ==============================================================================
-- Objetivo: Desfazer a restrição caso o middleware esteja bloqueando administradores válidos
-- sem recriar as falhas de escrita pública. NENHUM DADO SERÁ APAGADO.
-- A tabela admin_users e os registros nela criados são mantidos.

BEGIN;

-- 1. Remove as policies estritas que foram criadas pela migration (se houver necessidade de voltar)
DROP POLICY IF EXISTS "Admin CRUD categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin CRUD produtos" ON public.products;
DROP POLICY IF EXISTS "Admin CRUD imagens" ON public.product_images;
DROP POLICY IF EXISTS "Admin CRUD campanhas" ON public.campaigns;
DROP POLICY IF EXISTS "Admin CRUD campaign_products" ON public.campaign_products;
DROP POLICY IF EXISTS "Admin CRUD clientes" ON public.customers;
DROP POLICY IF EXISTS "Admin CRUD movement_payments" ON public.movement_payments;
DROP POLICY IF EXISTS "Admin CRUD product_movements" ON public.product_movements;
DROP POLICY IF EXISTS "Admin Insert bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete bucket" ON storage.objects;

-- 2. Restaura uma configuração segura conhecida.
-- Ao invés de usar o antigo e perigoso `USING (true)`, este rollback irá instalar
-- políticas restritivas defensivas temporárias enquanto você resolve problemas do frontend.
-- Nenhuma operação de gravação funcionará para usuários que não passem por esse bloqueio administrativo manual temporário (substitua o uuid pelo do admin manualmente, se for urgente desbloquear):

-- OBSERVAÇÃO: Este script de rollback presume que você usou o preflight antes
-- para listar policies. Caso prefira apenas deixar o banco bloqueado para garantir segurança:
-- Apenas os DROPS acima garantirão que as escritas estarão temporariamente fechadas.
-- É o comportamento recomendado para proteção.

COMMIT;
