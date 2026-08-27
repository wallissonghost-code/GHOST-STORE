# GHOST STORE

Marketplace digital para venda de projetos, ZIPs, GLBs, sites, sistemas, assets, sprites, ideias e produtos digitais.

## Estado atual

A loja já inclui:

- Home premium e responsiva
- Catálogo de produtos
- Categorias, filtros e pesquisa
- Modal com detalhes do produto
- Carrinho persistente no navegador
- Formulário para projeto sob medida
- Painel administrativo em `admin.html`
- Cadastro, edição, publicação, rascunho e exclusão de produtos
- Modo local funcional via `localStorage`
- Leitura de catálogo via Supabase quando configurado
- Estrutura SQL para tabela de produtos e bucket privado

## Arquivos principais

- `index.html` — vitrine da loja
- `styles.css` — visual principal e responsividade
- `app.js` — catálogo, filtros, pesquisa, modal, carrinho e carregamento de produtos
- `admin.html` — painel administrativo
- `admin.css` — estilos do painel
- `admin.js` — CRUD de produtos e preparação para Supabase
- `config.js` — configuração pública do backend
- `supabase-schema.sql` — schema inicial e regras de segurança

## Modo local

Sem Supabase configurado, o painel funciona no navegador e grava os produtos em `localStorage` usando a chave `ghostStoreProducts`. A vitrine lê os mesmos dados no mesmo navegador.

## Conectar ao Supabase

1. Crie/selecione um projeto Supabase.
2. Execute `supabase-schema.sql` no SQL Editor.
3. Em `config.js`, preencha `supabaseUrl` e `supabaseAnonKey`.
4. A vitrine passa a ler somente produtos publicados da tabela `products`.
5. Para escrita administrativa em produção, configure autenticação e uma policy específica para administradores. Não abra INSERT/UPDATE/DELETE para usuários anônimos.

## Segurança dos arquivos pagos

O bucket `product-files` é privado. ZIPs, GLBs e outros produtos pagos não devem ser publicados no GitHub Pages nem em URLs públicas. O fluxo final deve gerar uma URL assinada apenas depois que o pagamento do pedido for confirmado.

## Próximas integrações

1. Login seguro do administrador
2. Upload de arquivos direto pelo painel
3. Imagens e vídeos de preview por produto
4. Checkout real
5. Pedidos e clientes no banco
6. Liberação automática do download após pagamento
7. Produtos exclusivos com estoque unitário
8. Licenças pessoal, comercial e exclusiva
