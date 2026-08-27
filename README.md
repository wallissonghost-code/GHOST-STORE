# GHOST STORE

Marketplace digital para venda de projetos, ZIPs, GLBs, sites, sistemas, assets, sprites, ideias e produtos digitais.

## Estado atual

A primeira versão da vitrine está pronta e inclui:

- Home premium e responsiva
- Catálogo de produtos
- Categorias
- Filtros
- Pesquisa
- Modal com detalhes do produto
- Carrinho persistente no navegador
- Geração de pedido para checkout futuro
- Formulário para projeto sob medida
- Layout mobile/desktop

## Arquivos principais

- `index.html` — estrutura da loja
- `styles.css` — identidade visual e responsividade
- `app.js` — catálogo, filtros, pesquisa, modal e carrinho

## Próximas integrações recomendadas

1. Banco de dados e painel administrativo
2. Autenticação de administrador
3. Cadastro/edição/exclusão de produtos
4. Upload seguro de ZIP, GLB, PNG e outros arquivos
5. Checkout real
6. Liberação de downloads somente após pagamento
7. Histórico de pedidos
8. Produtos exclusivos com estoque unitário
9. Licenças pessoal, comercial e exclusiva
10. Preview com imagens, vídeos e demos

## Observação de segurança

Não coloque arquivos pagos diretamente dentro de uma pasta pública do GitHub Pages. Quando o backend for conectado, os downloads devem ficar em storage privado e serem liberados por URL assinada/autorizada após confirmação do pagamento.
