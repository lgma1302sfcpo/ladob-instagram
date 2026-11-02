# Lado B do Mercado

Site de vendas em português com e-book de R$ 19, guia de R$ 97 e apresentação da NexoFrame IA. HTML, CSS e JavaScript com funções Node para Vercel e Stripe Checkout.

## Desenvolvimento

```sh
npm ci
npm run dev
```

Abra http://localhost:3000. A página abre sem segredos; os pagamentos ficam indisponíveis até configurar o ambiente.

Copie `.env.example` para `.env.local` e preencha as variáveis somente no computador ou no painel de ambiente da Vercel. Nunca inclua chaves em commits.

## Pagamentos e entrega

- Integração bloqueada em **modo de teste** da Stripe.
- Dois produtos, pagamento único em BRL: R$ 19 e R$ 97.
- Checkout com cartão e Pix, sujeito à habilitação da conta.
- Webhook com verificação de assinatura e confirmação de pagamento.
- Download na página de confirmação, estado de acesso na Stripe e PDFs no Vercel Blob privado.
- Links de acesso assinados, com validade limitada e nova validação do pagamento.

Depois de configurar a chave de teste, `npm run stripe:setup` cria/reutiliza os produtos e preços de teste. Nenhuma chave de produção é aceita pelo código atual.

## Conteúdo privado

Este repositório é público e contém somente o site, suas capas e a implementação. Os PDFs vendidos e os textos completos dos produtos não são versionados. Eles foram entregues separadamente e devem ser enviados para armazenamento privado. As pastas `content/` e `output/` são ignoradas. O comando local de geração dos livros depende dos arquivos privados e das dependências Python descritas no manual.

## Publicação e validação

Importe o repositório na Vercel com framework **Other**, diretório de saída **public** e sem comando de build. Cadastre as variáveis do ambiente. Configure `/api/webhook` na Stripe em modo de teste. Execute `npm test` e valide os pagamentos completos com cartão e Pix de teste antes das vendas.

O site está em https://ladob-instagram.vercel.app, com Stripe configurada em teste, webhook e PDFs privados. A entrega foi definida pelo titular como download direto, com suporte pelo WhatsApp. Não é necessária conta Resend. Os dados do vendedor e a política de privacidade ainda precisam ser completados antes das vendas. Consulte [LEIA-ME.md](LEIA-ME.md) e [PENDENCIAS.md](PENDENCIAS.md).

Conteúdo informativo e educacional. Não é recomendação de investimento.
