import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import Stripe from 'stripe';
import {stripe,paidOrder} from '../lib/commerce.mjs';
const client=stripe(),links=JSON.parse(await readFile('output/test-sessions.json','utf8')),base='https://ladob-instagram.vercel.app',report={};
for(const [key,url] of Object.entries(links)){
 const sid=new URL(url).pathname.split('/').pop();const {session}=await paidOrder(client,sid);
 if(session.livemode||session.metadata.product!==key)throw Error('Pedido fora do teste esperado');
 const r=await fetch(base+'/api/session?session_id='+encodeURIComponent(sid));const data=await r.json();if(!r.ok||!data.paid)throw Error('Sessão paga recusada');
 const pdf=await fetch(data.download);const bytes=Buffer.from(await pdf.arrayBuffer());const original=await readFile('output/pdf/'+(key==='ebook'?'ebook-lado-b':'guia-perfil-ia')+'.pdf');
 if(pdf.status!==200||createHash('sha256').update(bytes).digest('hex')!==createHash('sha256').update(original).digest('hex'))throw Error('PDF incorreto');
 // Replay assinado de payload de teste: valida HTTP e idempotência no endpoint publicado.
 const payload=JSON.stringify({id:'evt_signed_replay_'+key,livemode:false,type:'checkout.session.completed',data:{object:{id:sid,payment_status:'paid'}}});const replay=[];
 for(let i=0;i<2;i++){
  const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
  const rr=await fetch(base+'/api/webhook',{method:'POST',headers:{'stripe-signature':signature,'content-type':'application/json'},body:payload});replay.push(rr.status);if(rr.status!==200)throw Error('Replay do webhook falhou');
 }
 const updated=await client.checkout.sessions.retrieve(sid);
 report[key]={paymentStatus:session.payment_status,downloadStatus:pdf.status,correctPDF:true,webhookReplayStatuses:replay,downloadReady:updated.metadata.download_ready==='true'};
}
await writeFile('output/paid-checkouts-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
