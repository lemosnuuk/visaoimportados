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
    price NUMERIC(12, 2) NOT NULL,
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
