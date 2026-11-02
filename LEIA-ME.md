# Lado B do Mercado

Site: https://ladob-instagram.vercel.app
GitHub: https://github.com/lgma1302sfcpo/ladob-instagram

## Formato escolhido pelo titular

A entrega é somente por download após confirmação do pagamento, com suporte pelo WhatsApp (13) 99121-3068. Não há envio por e-mail, Resend, Redis, Upstash ou S3 externo. O e-mail coletado pela Stripe identifica a compra para suporte e arrependimento.

## Configuração concluída em produção

- Projeto Vercel `lgma1302sfcpos-projects/ladob-instagram`, vinculado ao GitHub.
- Dois produtos Stripe, pagamento único BRL: e-book R$ 19 e guia R$ 97.
- Cartão e Pix disponíveis e ligados na conta.
- Webhook em `/api/webhook`, com assinatura verificada e eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`.
- Chave restrita real, segredo do webhook real, IDs dos preços e segredo HMAC exclusivo no `.env.live.local` ignorado pelo Git e nas variáveis criptografadas Production da Vercel. `.env.local`, Preview e Development conservam as credenciais de teste.
- Vercel Blob privado `ladob-pdfs-private`, região iad1, Estados Unidos. Os PDFs foram enviados e conferidos por SHA-256. Sem assinatura, retornaram HTTP 403.

O alvo Production da hospedagem Vercel não significa Stripe em produção. `STRIPE_MODE` determina o ambiente, com padrão `test`. O código aceita produção apenas com modo `live` e chave real correspondente, e rejeita mistura de ambientes. O aviso do site consulta `/api/payment-config`. Não foi feita cobrança real.

## Rodar

Use Node 22 ou posterior:

```sh
npm ci
npm run dev
npm test
```

Abra http://localhost:3000. Para testar localmente, `SITE_URL` deve apontar para essa origem; na Vercel, use a origem HTTPS publicada. O `.env.example` é um modelo público sem segredos, e seus marcadores são intencionais.

## Variáveis necessárias

| Nome | Finalidade |
| --- | --- |
| SITE_URL | Origem exata, sem barra final. |
| STRIPE_MODE | test (padrão) ou live, explícito para produção. |
| STRIPE_SECRET_KEY | Chave sk_ ou rk_ da conta NexoFrame, do mesmo ambiente. |
| STRIPE_WEBHOOK_SECRET | Segredo whsec_ do endpoint do mesmo ambiente. |
| STRIPE_PRICE_EBOOK, STRIPE_PRICE_GUIA | IDs dos preços únicos em BRL. |
| DOWNLOAD_SIGNING_SECRET | Segredo exclusivo de pelo menos 32 bytes. |
| BLOB_READ_WRITE_TOKEN | Credencial do armazenamento privado vinculada pela Vercel. |
| BLOB_PATH_EBOOK | Opcional, padrão products/ebook-lado-b.pdf. |
| BLOB_PATH_GUIA | Opcional, padrão products/guia-perfil-ia.pdf. |

Não coloque segredos em código do navegador, Git, mensagens de chat, argumentos de shell ou prints. O script `configure-test.mjs` usa as credenciais locais sem imprimi-las e recusa conta divergente ou chave de produção. Ele configura o webhook de teste e as variáveis de Preview e Development da Vercel, sem sobrescrever Production. Os preços usam lookup keys `ladob_ebook_v1` e `ladob_guia_v1`; `npm run stripe:setup` reutiliza os preços já configurados e não os duplica.

## Como o acesso funciona

1. O checkout recebe somente um identificador de produto. O servidor confere preço, moeda e valor antes de criar a sessão.
2. O webhook verifica a assinatura do corpo bruto e só registra download pronto para uma sessão completa e paga. A marcação usa idempotência e metadados da própria Stripe. Pix pendente não libera o material.
3. A página de obrigado consulta o pagamento e oferece Baixar meu PDF e Copiar link de acesso.
4. O link de acesso é assinado por HMAC e expira 7 dias após a criação do checkout. Cada clique reconsulta o pagamento e emite uma URL do Blob válida por 5 minutos, limitada ao PDF comprado.
5. Reembolso, disputa, moeda/valor/preço divergente ou token adulterado impedem nova emissão. Uma URL do Blob já emitida pode continuar válida por até 5 minutos.

Links e identificadores de sessão funcionam como credenciais de posse. Quem receber o link pode usá-lo até expirar: não o compartilhe. A aplicação utiliza no-store e no-referrer. Configure os logs de infraestrutura para ocultar query strings das rotas de sessão/download. Não adicione analytics à página de acesso. A URL da página de obrigado é limpa após a validação; guarde o link pelo botão Copiar link de acesso.

## Recuperação e suporte

O comprador pode chamar o WhatsApp e informar o e-mail usado na compra. O titular deve localizar o pedido na Stripe e confirmar os dados de modo proporcional antes de enviar qualquer novo acesso. Não envie um link só porque alguém conhece um e-mail. Não há chatbot WhatsApp nem envio automático de mensagens configurado. Um link já expirado exige atendimento do titular; não publique o PDF para resolver o pedido.

## PDFs e atualização

Os arquivos ficam em `output/pdf`, com conteúdo editável em `content`. Essas pastas não são versionadas nem publicadas. O `.vercelignore` também exclui segredos e arquivos privados. Só as capas e a imagem social ficam em public.

Para atualizar os livros locais, edite os JSONs e execute `python scripts/make_books.py` após instalar reportlab, pypdf, pillow e fonttools. Renderize com Poppler e revise o layout. O gerador interrompe em overflow; o sumário pressupõe duas páginas por caso. O checklist para imprimir fica na página 35 do guia.

Para atualizar o armazenamento:

```sh
node --env-file=.env.local scripts/upload-private-pdfs.mjs
node --env-file=.env.local scripts/check-private-storage.mjs
```

O upload usa somente dois caminhos, sempre privados, e confere os hashes. O segundo script verifica que a assinatura é necessária. Os seis marcadores de captura real e a validação do processo do perfil continuam pendentes. Não invente exemplos reais ou resultados.

## Preços e publicação

Para mudar preços, atualize o catálogo do servidor, os textos e data-count do site, o script de configuração e os IDs no ambiente. Preços Stripe são imutáveis: crie um novo preço e atualize as referências. Não mude apenas o valor visível.

O projeto usa framework Other, saída public e funções Node na pasta api. O GitHub está conectado. Para publicar manualmente após alterar código ou variáveis:

```sh
npx vercel deploy --prod --yes --scope lgma1302sfcpos-projects
```

A URL pública de produção do site recebe os webhooks sem login. Preserve a proteção padrão da Vercel nas URLs de preview. O domínio atual está no canonical e na imagem social; atualize ambos se trocar o domínio.

## Homologação e produção

Use cartão de teste 4242 4242 4242 4242, validade futura e CVC fictício. No Pix, use apenas o simulador oficial da Stripe, nunca um aplicativo bancário real. Confira ambos os PDFs, os hashes dos downloads, o bloqueio enquanto pendente, token expirado/adulterado, reenvio do webhook e reembolso de teste. Os scripts test-hosted.mjs e os relatórios em output ajudam nessa verificação; não publique os arquivos de sessões de teste, pois contêm links de acesso.

Os dados de vendedor/privacidade, a validação do guia e as capturas próprias continuam pendentes. O titular autorizou a troca para produção e a criação da chave real restrita; produtos, preços, webhook e variáveis Production foram configurados. Produtos, preços e webhook reais são separados dos testes. Trocar somente a chave não ativa produção.

Após fornecer a chave real de forma segura em `.env.live.local` (ignorado pelo Git), execute `node scripts/configure-live.mjs`. O script confere a conta e a habilitação para cobranças, cria/reutiliza os dois preços e o webhook reais, gera um segredo de download exclusivo e atualiza somente as variáveis Production da Vercel. Exige permissões de escrita em Checkout Sessions, Products, Prices e Webhook Endpoints, e leitura em Accounts, Payment Intents e Charges and Refunds. Não concede permissão de repasses. Publique um novo deploy depois de atualizar variáveis.

Execute `node --env-file=.env.live.local scripts/verify-live.mjs` para verificar o ambiente publicado, os dois checkouts reais e o bloqueio de acesso de pedidos ainda não pagos, sem confirmar cobranças. Guarde `output/live-checkouts.json` em privado. Testes simulados com cartões fictícios e eventos fabricados devem usar somente o modo de teste; o script `test-hosted.mjs` não aceita ambiente live.

O Lighthouse mobile local inicial marcou 92 em desempenho e 100 nas demais categorias. Repita no deploy final e em aparelho físico; isso não garante 60 fps em todo celular.
