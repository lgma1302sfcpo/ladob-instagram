// Verifica configuração e checkout sem confirmar pagamentos ou movimentar dinheiro.
import {writeFile} from 'node:fs/promises';
import {stripe,liveMode,baseURL,catalog} from '../lib/commerce.mjs';
if(!liveMode())throw Error('Use o ambiente de produção');
const client=stripe(),base=baseURL(),report={},sessions={};
const config=await fetch(base+'/api/payment-config');
if(!config.ok||(await config.json()).mode!=='live')throw Error('Site ainda não está em modo real');
report.mode='live';report.products={};
for(const name of ['checkout-logo.png','checkout-icon.png']){
 const asset=await fetch(base+'/assets/'+name,{method:'HEAD'});
 if(!asset.ok||!asset.headers.get('content-type')?.includes('image/png'))throw Error('Imagem do checkout indisponível');
}
for(const key of Object.keys(catalog)){
 const response=await fetch(base+'/api/checkout',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({product:key})});
 const data=await response.json();if(!response.ok)throw Error('Checkout '+key+': HTTP '+response.status);
 const url=new URL(data.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('URL de checkout inválida');
 const sid=url.pathname.split('/').pop();if(!/^cs_live_[A-Za-z0-9]+$/.test(sid))throw Error('Sessão não é de produção');
 const session=await client.checkout.sessions.retrieve(sid);
 if(!session.livemode||session.payment_status!=='unpaid'||session.amount_total!==catalog[key].amount||session.currency!=='brl')throw Error('Sessão real incompatível');
 const branding=session.branding_settings;
 if(branding?.background_color?.toLowerCase()!=='#0b0d11'||branding?.button_color?.toLowerCase()!=='#ffc629'||branding?.display_name!=='Lado B do Mercado'||branding?.logo?.url!==base+'/assets/checkout-logo.png')throw Error('Identidade do checkout incompatível');
 const pending=await fetch(base+'/api/session?session_id='+encodeURIComponent(sid));if(pending.status!==409)throw Error('Pedido sem pagamento liberou acesso');
 sessions[key]={id:sid,url:data.url};
 report.products[key]={live:true,amount:session.amount_total,paymentMethods:session.payment_method_types,branding:{background:branding.background_color,button:branding.button_color,displayName:branding.display_name},unpaidDownloadStatus:pending.status};
}
const invalid=await fetch(base+'/api/webhook',{method:'POST',headers:{'stripe-signature':'invalid','content-type':'application/json'},body:'{}'});
const download=await fetch(base+'/api/download?token=invalid');
if(invalid.status!==400||download.status!==403)throw Error('Falha na proteção das rotas');
report.invalidSignatureStatus=invalid.status;report.invalidDownloadStatus=download.status;report.chargesCreated=0;
await writeFile('output/live-checkouts.json',JSON.stringify(sessions,null,2));
await writeFile('output/live-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
