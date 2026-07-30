-- VISÃO IMPORTADOS - BANCO DE DADOS E ESTRUTURA SUPABASE

-- 1. LIMPEZA (OPCIONAL - CASO QUEIRA REINICIAR)
-- DROP TRIGGER IF EXISTS update_products_updated_at ON products;
-- DROP TABLE IF EXISTS product_images;
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS categories;

-- 2. TABELA DE CATEGORIAS
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE PRODUTOS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(12, 2),
    sale_price NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'in_stock' CONSTRAINT check_status CHECK (status IN ('in_stock', 'pre_order', 'on_request')),
    featured BOOLEAN DEFAULT false NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    brand TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE IMAGENS DE PRODUTOS
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TRIGGER PARA ATUALIZAR O CAMPO UPDATED_AT EM PRODUCTS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. HABILITAR SEGURANÇA POR NÍVEL DE LINHA (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS - CATEGORIAS
-- Leitura pública para qualquer visitante (anon e authenticated)
CREATE POLICY "Permitir leitura publica de categorias" 
ON categories FOR SELECT 
USING (true);

-- Controle total para administradores autenticados
CREATE POLICY "Permitir controle total de categorias para admins" 
ON categories FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 8. POLÍTICAS RLS - PRODUTOS
-- Leitura pública para qualquer visitante
CREATE POLICY "Permitir leitura publica de produtos" 
ON products FOR SELECT 
USING (true);

-- Controle total para administradores autenticados
CREATE POLICY "Permitir controle total de produtos para admins" 
ON products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 9. POLÍTICAS RLS - IMAGENS DOS PRODUTOS
-- Leitura pública para qualquer visitante
CREATE POLICY "Permitir leitura publica de imagens" 
ON product_images FOR SELECT 
USING (true);

-- Controle total para administradores autenticados
CREATE POLICY "Permitir controle total de imagens para admins" 
ON product_images FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 10. CONFIGURAÇÃO DE STORAGE (BUCKET PARA IMAGENS DOS PRODUTOS)
-- Insere o bucket se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS no Storage (se necessário, geralmente habilitado por padrão)
-- RLS para objetos do bucket 'product-images'

-- Leitura pública das imagens
CREATE POLICY "Permitir leitura publica de imagens do bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Upload/Modificação/Exclusão restrito a administradores autenticados
CREATE POLICY "Permitir upload de imagens para admins"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Permitir atualizacao de imagens para admins"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Permitir exclusao de imagens para admins"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 11. INSERÇÃO DE CATEGORIAS PADRÃO (SEEDS)
INSERT INTO categories (name, slug) VALUES
('Perfumes', 'perfumes'),
('Eletrônicos', 'eletronicos'),
('Scooters', 'scooters'),
('Informática', 'informatica'),
('Games', 'games'),
('Smart Home', 'smart-home'),
('Gadgets', 'gadgets'),
('Acessórios', 'acessorios'),
('Novidades', 'novidades')
ON CONFLICT (slug) DO NOTHING;

-- 12. ATUALIZAÇÕES DE COLUNAS (MIGRAÇÃO DE BANCOS EXISTENTES)
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0 NOT NULL;

-- 13. TABELAS PARA CAMPANHAS PROMOCIONAIS
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  badge_label TEXT NOT NULL,
  hero_subtitle TEXT,
  hero_title TEXT,
  banner_image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  discount_percentage NUMERIC(5,2),
  campaign_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, product_id)
);

-- RLS PARA CAMPANHAS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de campanhas" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de produtos da campanha" ON campaign_products FOR SELECT USING (true);

CREATE POLICY "Permitir gerencimento de campanhas para admins" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir gerencimento de produtos da campanha para admins" ON campaign_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. TABELA DE HISTÓRICO DE PAGAMENTOS E ABATIMENTOS DAS MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS movement_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id UUID REFERENCES product_movements(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE movement_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública de pagamentos da movimentação" ON movement_payments FOR SELECT USING (true);
CREATE POLICY "Permitir gerencimento de pagamentos para admins" ON movement_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DO STATUS E ESTOQUE DOS PRODUTOS
CREATE OR REPLACE FUNCTION update_product_stock_and_status()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
    total_entrada NUMERIC;
    total_saida NUMERIC;
    current_stock NUMERIC;
BEGIN
    -- Identifica o product_id afetado (seja INSERT, UPDATE ou DELETE)
    IF (TG_OP = 'DELETE') THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Soma das entradas do produto
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_entrada
    FROM product_movements
    WHERE product_id = target_product_id AND type = 'entrada';

    -- Soma das saídas do produto
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_saida
    FROM product_movements
    WHERE product_id = target_product_id AND type = 'saida';

    -- Calcula o estoque atual
    current_stock := total_entrada - total_saida;

    -- Atualiza o status do produto:
    -- Se o estoque for > 0 -> 'in_stock' (Em Estoque)
    -- Se o estoque for <= 0 -> 'pre_order' (Sob Encomenda)
    -- (Preserva o status 'on_request' caso o produto seja especificamente Sob Consulta)
    UPDATE products
    SET 
        status = CASE 
            WHEN current_stock > 0 THEN 'in_stock'
            ELSE 'pre_order'
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_product_id
      AND status != 'on_request';

    -- Trata mudança de produto no UPDATE de uma movimentação (caso mude o produto associado)
    IF (TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
        SELECT COALESCE(SUM(quantity), 0) INTO total_entrada FROM product_movements WHERE product_id = OLD.product_id AND type = 'entrada';
        SELECT COALESCE(SUM(quantity), 0) INTO total_saida FROM product_movements WHERE product_id = OLD.product_id AND type = 'saida';
        
        UPDATE products
        SET status = CASE WHEN (total_entrada - total_saida) > 0 THEN 'in_stock' ELSE 'pre_order' END,
            updated_at = timezone('utc'::text, now())
        WHERE id = OLD.product_id AND status != 'on_request';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger disparado após qualquer INSERT, UPDATE ou DELETE em product_movements
DROP TRIGGER IF EXISTS trg_update_product_stock_status ON product_movements;

CREATE TRIGGER trg_update_product_stock_status
AFTER INSERT OR UPDATE OR DELETE ON product_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_and_status();

-- Atualização única para recalcular e recalibrar o status de todos os produtos existentes
UPDATE products p
SET status = CASE 
    WHEN COALESCE((
        SELECT SUM(CASE WHEN type = 'entrada' THEN quantity ELSE -quantity END)
        FROM product_movements
        WHERE product_id = p.id
    ), 0) > 0 THEN 'in_stock'
    ELSE 'pre_order'
END
WHERE p.status != 'on_request';

-- 16. COLUNA DE IMAGEM PARA CATEGORIAS
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

 
 - -   1 7 .   T A B E L A   D E   C L I E N T E S  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   c u s t o m e r s   (  
         i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
         n a m e   T E X T   N O T   N U L L   U N I Q U E ,  
         p h o n e   T E X T ,  
         e m a i l   T E X T ,  
         c r e a t e d _ a t   T I M E S T A M P T Z   D E F A U L T   N O W ( )   N O T   N U L L  
 ) ;  
  
 A L T E R   T A B L E   c u s t o m e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 C R E A T E   P O L I C Y   \  
 P e r m i t i r  
 l e i t u r a  
 p u b l i c a  
 d e  
 c l i e n t e s \   O N   c u s t o m e r s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   \  
 P e r m i t i r  
 g e r e n c i m e n t o  
 d e  
 c l i e n t e s  
 p a r a  
 a d m i n s \   O N   c u s t o m e r s   F O R   A L L   T O   a u t h e n t i c a t e d   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
  
 - -   M I G R A C A O   D E   D A D O S :   I N S E R E   C L I E N T E S   E X I S T E N T E S   D A S   M O V I M E N T A C O E S  
 I N S E R T   I N T O   c u s t o m e r s   ( n a m e )  
 S E L E C T   D I S T I N C T   c u s t o m e r _ n a m e  
 F R O M   p r o d u c t _ m o v e m e n t s  
 W H E R E   c u s t o m e r _ n a m e   I S   N O T   N U L L   A N D   c u s t o m e r _ n a m e   ! =   ' '  
 O N   C O N F L I C T   ( n a m e )   D O   N O T H I N G ;  
  
 - -   A D I C I O N A   V I N C U L O   N A   T A B E L A   D E   M O V I M E N T A C O E S  
 A L T E R   T A B L E   p r o d u c t _ m o v e m e n t s   A D D   C O L U M N   I F   N O T   E X I S T S   c u s t o m e r _ i d   U U I D   R E F E R E N C E S   c u s t o m e r s ( i d )   O N   D E L E T E   S E T   N U L L ;  
  
 - -   A T U A L I Z A   O   V I N C U L O   D O S   R E G I S T R O S   E X I S T E N T E S  
 U P D A T E   p r o d u c t _ m o v e m e n t s   p m  
 S E T   c u s t o m e r _ i d   =   c . i d  
 F R O M   c u s t o m e r s   c  
 W H E R E   p m . c u s t o m e r _ n a m e   =   c . n a m e ;  
 