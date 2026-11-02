import {writeFile} from 'node:fs/promises';import Stripe from 'stripe';
const base='https://ladob-instagram.vercel.app';const result={},sessions={};
const html=await fetch(base);result.siteStatus=html.status;result.testNotice=(await html.text()).includes('PAGAMENTOS EM MODO DE TESTE');
for(const product of ['ebook','guia']){
 const r=await fetch(base+'/api/checkout',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({product})});const data=await r.json();
 if(!r.ok||!data.url?.startsWith('https://checkout.stripe.com/'))throw Error('Falha no checkout '+product+': HTTP '+r.status);
 sessions[product]=data.url;result[product]={checkoutStatus:r.status,created:true};
}
const invalid=await fetch(base+'/api/webhook',{method:'POST',headers:{'stripe-signature':'invalid','content-type':'application/json'},body:'{}'});result.invalidSignatureStatus=invalid.status;
const pending=JSON.stringify({id:'evt_local_signed_pending_test',livemode:false,type:'checkout.session.completed',data:{object:{id:'cs_test_pending',payment_status:'unpaid'}}});
const signature=Stripe.webhooks.generateTestHeaderString({payload:pending,secret:process.env.STRIPE_WEBHOOK_SECRET});
const wait=await fetch(base+'/api/webhook',{method:'POST',headers:{'stripe-signature':signature,'content-type':'application/json'},body:pending});result.pendingWebhook={status:wait.status,...await wait.json()};
const blocked=await fetch(base+'/api/download?token=invalid');result.invalidDownloadStatus=blocked.status;
await writeFile('output/test-sessions.json',JSON.stringify(sessions,null,2));await writeFile('output/hosted-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
if(html.status!==200||invalid.status!==400||wait.status!==200||blocked.status!==403)process.exitCode=1;
