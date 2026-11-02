# Lado B do Mercado

Projeto em português do Brasil, preparado para Vercel. Contém o e-book de 46 páginas, o guia de 36 páginas e a loja de uma página. Os PDFs estão em `output/pdf`; os HTMLs editáveis estão em `content`. Nenhum PDF está no diretório público.

## O que está pronto e o que depende de acesso

O site, o conteúdo pesquisado e o código de pagamento/entrega foram criados. As fontes estão no fim de cada capítulo e nas páginas relevantes do guia. O fluxo do perfil precisa ser validado pelo titular, e as seis capturas reais indicadas no guia precisam ser inseridas antes da venda. Não foram inventadas métricas ou experiências do perfil.

Não foram criados produtos na conta Stripe, nem executadas compras Stripe, envio real de e-mail ou publicação Vercel: não há credenciais dessas contas configuradas nesta entrega. O projeto recusa chaves Stripe de produção. As verificações automatizadas de pagamento são locais, com simulações; não equivalem à homologação ponta a ponta. Consulte `PENDENCIAS.md` para os campos e as etapas restantes.

## Rodar localmente

Use Node.js 22 ou posterior e npm:

```powershell
cd "C:\Users\estag\OneDrive\Documentos\New project\lado-b"
npm ci
npm run dev
```

Abra `http://localhost:3000`. Sem credenciais, os botões de compra mostram uma mensagem de checkout indisponível. Não simulam uma compra aprovada. O script local serve apenas `public` e quatro rotas de API autorizadas. Não o utilize como servidor público.

Copie `.env.example` para `.env.local` e preencha localmente. Não envie segredos em chat, commits, prints ou mensagens de erro. O arquivo é ignorado pelo Git. Na Vercel, cadastre os mesmos valores no painel de variáveis de ambiente.

## Variáveis

| Variável | Finalidade |
| --- | --- |
| `SITE_URL` | Origem exata; localhost no desenvolvimento, HTTPS no ambiente hospedado. Não incluir barra final. |
| `STRIPE_SECRET_KEY` | Chave `sk_test_` da conta NexoFrame. O código recusa produção. |
| `STRIPE_WEBHOOK_SECRET` | Segredo `whsec_` do endpoint ou do Stripe CLI. Cada ambiente tem seu segredo. |
| `STRIPE_PRICE_EBOOK`, `STRIPE_PRICE_GUIA` | IDs dos preços de teste, pagamento único BRL. |
| `DOWNLOAD_SIGNING_SECRET` | Segredo exclusivo com pelo menos 32 bytes aleatórios. Gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Chave e remetente de domínio verificado no Resend. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis persistente para marcação e bloqueio de entregas. |
| `S3_REGION`, `S3_BUCKET` | Região e nome do bucket privado. |
| `S3_ENDPOINT` | Opcional para armazenamento compatível com S3. Vazio para AWS S3. |
| `S3_FORCE_PATH_STYLE` | `true` somente se exigido pelo provedor. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Credencial do servidor com permissão somente de leitura nos PDFs. |
| `S3_KEY_EBOOK`, `S3_KEY_GUIA` | Caminhos dos dois PDFs dentro do bucket. |

## Criar os dois produtos no teste da Stripe

Depois de configurar a chave de teste, execute:

```powershell
npm run stripe:setup
```

O script cria os produtos e os preços de R$ 19 e R$ 97, sem assinatura, em BRL. Utiliza `lookup_key` e chaves de idempotência para evitar duplicação em execuções normais. Ele imprime somente os IDs públicos dos preços. Copie-os para as duas variáveis `STRIPE_PRICE_*`. O script nunca aceita `sk_live_`.

No Dashboard de teste, confirme cartão e Pix habilitados para a conta. A disponibilidade do Pix depende da elegibilidade e da ativação na Stripe; uma requisição com `pix` não substitui essa ativação. Documentação: https://docs.stripe.com/payments/pix

## Entrega dos PDFs

1. Envie `output/pdf/ebook-lado-b.pdf` e `output/pdf/guia-perfil-ia.pdf` ao bucket privado. Bloqueie acesso público e não forneça permissões de listagem aos visitantes.
2. Configure Resend com remetente verificado, Redis e variáveis S3. Valide o arquivo correspondente a cada chave de objeto.
3. Crie na Stripe o endpoint `https://SEU-DOMINIO/api/webhook`. Assine os eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`. Use o segredo do endpoint correto.
4. O webhook lê o corpo bruto e verifica a assinatura com o SDK oficial. Só entrega sessão completa e paga, no modo de teste, com moeda, total, preço, quantidade e produto reconhecidos. Pix pendente não libera material.
5. O e-mail contém um token HMAC de acesso, válido até 7 dias após a criação do checkout. Cada clique reconsulta a Stripe e emite uma URL S3 com 5 minutos de validade. Reembolsos parciais/totais e disputas impedem nova emissão. Uma URL S3 já emitida pode continuar válida por até 5 minutos.
6. A página de obrigado consulta a sessão. Só mostra confirmação depois de validar pagamento. Só afirma que o e-mail chegou após encontrar o registro de envio aceito pelo provedor. Aceitação pelo provedor não garante chegada à caixa de entrada; confirme spam e eventuais bounces no Resend.

A sessão e o token são credenciais de acesso: não os compartilhe. A aplicação não registra dados de cartão nem o conteúdo dos links em seus próprios logs. Configure também os logs de infraestrutura para reduzir retenção e ocultar query strings em rotas de sessão/download. O navegador usa `Referrer-Policy: no-referrer`.

O Redis usa bloqueio temporário e marca persistente de entrega; o Resend recebe chave de idempotência por sessão. Se houver falha entre aceitação do e-mail e gravação no Redis, confira os registros do Resend antes de repetir manualmente um envio tardio. Não há transação atômica entre os dois fornecedores. A retenção e a rotina de descarte precisam ser definidas na política de privacidade.

## Homologação obrigatória antes das vendas

Rode `npm test`. Para testar com sua conta em modo de teste, utilize Stripe CLI:

```powershell
stripe listen --forward-to localhost:3000/api/webhook
```

Copie o `whsec_` exibido para `.env.local` e reinicie o servidor. Faça compras **reais do fluxo de teste**, iniciadas pelos botões da página:

- Cartão de teste `4242 4242 4242 4242`, validade futura e CVC de teste. Confira evento, e-mail e PDF correto para os dois produtos.
- Pix de teste: gere o QR code e siga o mecanismo de confirmação de teste descrito pela Stripe para a conta. Nunca pague o código com um aplicativo bancário real. Referência: https://docs.stripe.com/payments/pix/accept-a-payment
- Mantenha Pix pendente: não pode haver entrega. Confirme depois: deve liberar somente uma vez.
- Reenvie o mesmo evento no Dashboard. Verifique ausência de nova entrega e o registro do Redis.
- Provoque falha de e-mail e confira retorno HTTP 500 e nova tentativa Stripe. Confira o tratamento de bounce no provedor.
- Teste cancelamento, cartão recusado, assinatura inválida, preço incorreto, sessão alheia à loja, token modificado e expirado.
- Reembolse no modo de teste e confira que o endpoint não gera mais downloads.

O endpoint de obrigado usa o identificador opaco e longo da sessão como credencial de posse, sem conta de usuário. Abrir um identificador de sessão válido compartilhado pode dar acesso ao pedido pago correspondente; trate esse identificador como segredo. Não exponha a página de obrigado a ferramentas de analytics.

## Publicar na Vercel

Importe esta pasta como projeto independente, com framework `Other`, saída `public` e sem comando de build. O `vercel.json` já define a saída e os cabeçalhos. A pasta `api` contém funções Node. Revise no deploy de preview que `/api/checkout` e `/api/webhook` são funções, não arquivos estáticos.

Cadastre as variáveis, atualize `SITE_URL` para a URL HTTPS do preview e configure seu webhook de teste. Troque `og:image` em `public/index.html` por uma URL absoluta do domínio final e inclua o canonical quando o domínio for definido. Preencha a identificação do vendedor e finalize a política de privacidade. Conclua a homologação acima no preview, depois valide o domínio de vendas.

Não há deploy executado ou conta Vercel vinculada nesta entrega. Não use Sites como destino alternativo: o pedido exige Vercel.

## Aprovação para produção

Após aprovação explícita do titular, revise e remova os bloqueios de teste em `stripe()`, `paidOrder()`, `readToken()` e na validação do checkout/webhook. Gere IDs de produtos/preços em produção, segredos próprios, links `cs_live_` e texto de e-mail sem “teste”. Faça uma revisão conjunta dessas mudanças e da proteção de acesso. **Trocar apenas a variável de chave não funciona de propósito.** Nenhum produto, cobrança ou deploy de produção foi criado por este trabalho.

## Alterar conteúdo e preços

O conteúdo do e-book está em `content/research-brasil.json` e `content/research-international.json`. O guia está em `content/guide.json`. Edite os JSONs diretamente. Os geradores auxiliares `brasil.py` e `create_guide.py` preservam uma versão inicial e podem sobrescrever edições, então não os execute depois de alterar os JSONs sem atualizar também seus textos.

Instale `reportlab`, `pypdf`, `pillow` e `fonttools` no Python. Execute `python scripts/make_books.py` para gerar HTML e PDF. O gerador interrompe se um bloco ultrapassa a área útil da página. Renderize com Poppler e revise visualmente após cada alteração. Os números do sumário do e-book dependem de duas páginas por caso. Se mudar a estrutura, ajuste o cálculo.

Os PDFs não contêm JavaScript. O checklist do guia tem fundo branco para impressão. Para substituir marcadores de captura por imagens, adicione a captura autorizada ao gerador, ajuste a página e gere/revise novamente. A versão atual contém os marcadores permitidos pelo pedido.

Preços precisam ser alterados em conjunto em `lib/commerce.mjs`, no site (textos e atributos `data-count`), no script de configuração de preços e na variável de preço correspondente. Preços Stripe são imutáveis: crie outro, use `lookup_key`/versão nova e arquive o anterior quando adequado. Não altere somente o preço visível.

## Verificações e evidências

- `npm test`: testes locais dos controles de pagamento, token e webhook.
- `node scripts/qa.mjs`: screenshots e verificações com Playwright e Microsoft Edge instalado. Requer servidor local já ativo. O modo `QA_START_SERVER=1` inicia e encerra seu próprio servidor.
- `output/screenshots`: imagens de celular e computador, incluindo página inteira.
- `output/qa.json`: resultado da verificação visual e de interação.
- Lighthouse: veja os resultados em `output/lighthouse` quando presentes. Uma medição local não garante 60 fps em todo aparelho nem o desempenho do deploy final. Repita na Vercel com a mesma configuração final.

Não há rastreadores de publicidade, biblioteca de animação ou fonte remota em execução. O canvas é leve, pausa com a aba oculta e respeita movimento reduzido. A fonte Montserrat é local e acompanha licença OFL. As capas e o gráfico do site são ilustrações editoriais, não cotações reais.
