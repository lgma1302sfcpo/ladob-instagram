# Pendências antes das vendas

Esta é uma entrega local com integração preparada. Nenhum pagamento real, produto Stripe de produção ou deploy foi executado.

## Todos os marcadores de dados

### Credenciais e serviços (.env.local / Vercel)

- STRIPE_SECRET_KEY: [PREENCHER] sk_test_ da conta NexoFrame
- STRIPE_WEBHOOK_SECRET: [PREENCHER] whsec_
- STRIPE_PRICE_EBOOK: [PREENCHER] price_
- STRIPE_PRICE_GUIA: [PREENCHER] price_
- DOWNLOAD_SIGNING_SECRET: [PREENCHER] segredo aleatório de pelo menos 32 bytes
- RESEND_API_KEY: [PREENCHER]
- EMAIL_FROM: [PREENCHER] NexoFrame <entregas@dominio-verificado>
- UPSTASH_REDIS_REST_URL: [PREENCHER]
- UPSTASH_REDIS_REST_TOKEN: [PREENCHER]
- S3_REGION: [PREENCHER]
- S3_BUCKET: [PREENCHER]
- S3_ACCESS_KEY_ID: [PREENCHER]
- S3_SECRET_ACCESS_KEY: [PREENCHER]

1. public\index.html: [PREENCHER: razão social, CPF/CNPJ e endereço comercial]

2. public\privacidade.html: [PREENCHER: razão social ou nome civil, CPF/CNPJ e endereço comercial do vendedor]
3. public\privacidade.html: [PREENCHER: e-mail do controlador]
4. public\privacidade.html: [PREENCHER: provedor, região e países de tratamento]
5. public\privacidade.html: [PREENCHER: registro dos países e mecanismos efetivamente contratados]
6. public\privacidade.html: [PREENCHER: tabela de retenção com prazos de pedidos, logs, e-mails, deduplicação, suporte e descarte nos fornecedores]

7. content\guide.json: [PREENCHER: validação do fluxo real, responsáveis e exemplos próprios autorizados]

## Capturas reais a inserir no guia

- Página 6: [PRINT: ficha real de checagem com URLs e dados pessoais ocultados]
- Página 10: [PRINT: conversa real no Claude mostrando ficha de fatos e instruções, sem dados privados]
- Página 17: [PRINT: configurações reais da voz no ElevenLabs, com modelo, velocidade e data visíveis]
- Página 19: [PRINT: página real de uma imagem no Commons, destacando autor, licença e ligação para os termos]
- Página 23: [PRINT: linha do tempo real no CapCut com narração, cartões e legendas do projeto autorizado]
- Página 30: [PRINT: telas reais de publicação do Instagram e TikTok com as opções de identificação de IA da conta]

## Etapas que exigem configuração da conta

- Validar o guia como método efetivamente usado pelo perfil; substituir o marcador editorial.
- Inserir as seis capturas próprias e revisar os PDFs.
- Confirmar a identificação completa do vendedor e a política de retenção/transferências de dados.
- Configurar chaves de teste da Stripe e rodar npm run stripe:setup para criar os dois produtos.
- Confirmar elegibilidade/ativação de Pix no painel da Stripe.
- Configurar domínio verificado de e-mail, Redis e bucket privado com os PDFs corretos.
- Testar cartão e Pix de teste, webhook, reenvio, e-mails e download ponta a ponta.
- Vincular Vercel, publicar preview, definir domínio e URL absoluta de og:image/canonical.
- Repetir o Lighthouse no deploy final e em celular físico.
- Obter aprovação explícita antes de qualquer alteração para produção.

Não há combo: o preço não foi definido e a seção foi omitida conforme solicitado.

Netflix, Nokia e Starbucks foram substituídas por Hertz, Chrysler e Delta para manter casos de insolvência documentada.
