# Pendências antes das vendas

## Já configurado

- Site publicado: https://ladob-instagram.vercel.app
- GitHub vinculado: lgma1302sfcpo/ladob-instagram.
- Dois produtos Stripe em teste: R$ 19 e R$ 97, únicos em BRL.
- Cartão e Pix disponíveis e ligados na conta.
- Webhook de teste com os dois eventos de confirmação e verificação de assinatura no servidor.
- Chaves locais ignoradas pelo Git e variáveis criptografadas na Vercel.
- Dois PDFs no Vercel Blob privado, região iad1 (Estados Unidos), com hashes conferidos.
- URLs de download privadas com expiração, e estado de acesso armazenado na Stripe.

## Formato final escolhido

Somente download após pagamento, com suporte pelo WhatsApp. Nenhum serviço de e-mail ou Redis é necessário.

## Todos os dados editoriais e legais ainda marcados

- [PREENCHER: razão social, CPF/CNPJ e endereço comercial] no rodapé do site.
- [PREENCHER: razão social ou nome civil, CPF/CNPJ e endereço comercial do vendedor] na privacidade.
- [PREENCHER: e-mail do controlador] na privacidade.
- [PREENCHER: registro dos países e mecanismos efetivamente contratados] na privacidade.
- [PREENCHER: tabela de retenção com prazos de pedidos, logs, disponibilização do download, suporte e descarte nos fornecedores] na privacidade.
- [PREENCHER: validação do fluxo real, responsáveis e exemplos próprios autorizados] no guia.

Os marcadores de credenciais em `.env.example` são intencionais. As credenciais de Stripe e Blob já estão no ambiente privado; os valores reais nunca devem substituir esse modelo público.

## Capturas reais do guia

- Página 6: ficha de checagem, com URLs e sem dados privados.
- Página 10: conversa no Claude com ficha e instruções.
- Página 17: voz no ElevenLabs, modelo, velocidade e data.
- Página 19: imagem no Commons com autor e licença.
- Página 23: linha do tempo do CapCut com projeto próprio.
- Página 30: identificação de IA nas telas de Instagram e TikTok.

## Aprovação final

Concluir a homologação de cartão, Pix, webhook, downloads ponta a ponta antes de mudar para produção. Não foram criados produtos Stripe de produção nem feitas cobranças reais. A habilitação para vendas reais exige aprovação explícita do titular e remoção revisada dos bloqueios de teste.

Não há combo porque o preço não foi definido. Netflix, Nokia e Starbucks foram substituídas por Hertz, Chrysler e Delta para sustentar casos de insolvência documentada.
