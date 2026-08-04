# Visão Importados - Documentação do Projeto

Este documento detalha a arquitetura, funcionalidades e estrutura completa do projeto **Visão Importados** desenvolvido até o momento. Trata-se de um e-commerce / catálogo digital focado em alta performance, usabilidade premium e gerenciamento via painel administrativo.

---

## 1. Tecnologias e Arquitetura

O projeto foi construído utilizando um ecossistema moderno focado em renderização rápida e forte tipagem:

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (tema Dark/Gold premium)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Armazenamento de Imagens:** Supabase Storage
- **Ícones:** Lucide React
- **Animações:** Framer Motion

### Banco de Dados (Supabase)
O banco de dados relacional foi estruturado em 4 tabelas principais:
1. `categories`: Gerencia as categorias (com suporte a imagem e slug).
2. `products`: Gerencia os produtos, preços (base e promocional), status (em estoque, sob encomenda, sob consulta), badges de campanha e imagens.
3. `customers`: Tabela isolada para manter o registro padronizado de todos os clientes (nome, telefone e anotações).
4. `product_movements`: Gerencia o estoque (entradas e saídas) sempre vinculado a um produto e a um cliente (`customer_id`). 

---

## 2. Funcionalidades Principais (Área do Cliente)

A interface voltada para o cliente final foi projetada para ter uma estética "Premium" e incentivar o contato direto.

- **Página Inicial (`/`)**: 
  - Layout hero com diferenciais exclusivos (Hover interativo).
  - Listagem de categorias em cards visuais.
  - Carrossel de produtos em destaque e campanhas promocionais.
- **Catálogo (`/catalogo`)**: 
  - Listagem completa de produtos.
  - Filtros dinâmicos por categoria e por status de disponibilidade.
  - Preço dinâmico, exibindo sempre o desconto quando há preço promocional.
- **Detalhes do Produto (`/produto/[slug]`)**: 
  - Galeria de imagens do produto.
  - Exibição clara do preço (com destaque para pagamento via PIX/Cartão).
  - Botão de compra rápida e integração para enviar a foto e detalhes do produto direto para o WhatsApp do vendedor.
- **Carrinho de Compras (`/carrinho`)**: 
  - Armazena itens em Context API.
  - Formulário para o cliente preencher nome, telefone e *forma de pagamento desejada* (Pix, Dinheiro ou Cartão).
  - Exportação inteligente do pedido para o WhatsApp, facilitando a finalização da venda.

---

## 3. Painel Administrativo (`/admin`)

O painel é protegido e gerenciado pelo lojista, permitindo um controle total da plataforma.

- **Dashboard**: Visão geral de métricas.
- **Gestão de Produtos (`/admin/produtos`)**:
  - Cadastro de produtos com upload múltiplo de imagens nativo do Supabase.
  - Definição de status, preços promocionais, edição e exclusão.
- **Gestão de Categorias (`/admin/categorias`)**:
  - Criação de categorias com suporte ao envio de imagem de capa (Upload no Supabase).
- **Gestão de Estoque/Movimentações (`/admin/movimentacoes`)**:
  - Histórico completo de entradas (compras do fornecedor) e saídas (vendas).
  - Relatórios de rentabilidade (focados no Preço Promocional de venda).
  - Seleção em lista suspensa do cliente, evitando duplicidade e erros de digitação.
- **Gestão de Clientes (`/admin/clientes`)**:
  - Nova aba dedicada ao cadastro prévio e edição dos clientes (CRM básico).
  - Visão geral do desempenho e compras de cada cliente.

---

## 4. Próximos Passos & Solução de Problemas

1. **Problema da Imagem no Vercel (Categorias)**
   Se uma imagem enviada para a categoria não está aparecendo na Vercel (mas funciona localmente), isso ocorre porque o arquivo `next.config.ts` do Vercel precisa ter o domínio da imagem cadastrado no `remotePatterns`, ou caso a imagem não tenha sido feita o upload completo no Bucket do Supabase antes do deploy. 
   *(O projeto já conta com o `*.supabase.co` autorizado nas configurações, então certifique-se apenas de que a imagem foi upada com sucesso na tela de Categorias)*.
   
2. **Melhorias Futuras**
   - Implementar autenticação restrita para o painel de Admin (Login / Senha).
   - Otimizar os relatórios de movimentação financeira (gráficos e filtros de data).
   - Suporte a múltiplas variações por produto (Cores, Tamanhos).
