import Stripe from 'stripe';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {S3Client,GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Redis} from '@upstash/redis';

export const catalog={ebook:{title:'E-book Lado B: 20 empresas que quase quebraram',amount:1900,priceEnv:'STRIPE_PRICE_EBOOK',fileEnv:'S3_KEY_EBOOK'},guia:{title:'Guia Perfil com IA do zero',amount:9700,priceEnv:'STRIPE_PRICE_GUIA',fileEnv:'S3_KEY_GUIA'}};
export function required(key){const v=process.env[key];if(!v||v.includes('[PREENCHER]'))throw new Error(`Configure ${key}`);return v;}
export function stripe(){
 const key=required('STRIPE_SECRET_KEY');
 // A mudança para produção exige alteração explícita deste bloqueio após aprovação do titular.
 if(!key.startsWith('sk_test_'))throw new Error('Este projeto está bloqueado em modo de teste.');
 return new Stripe(key,{maxNetworkRetries:2,timeout:15000});
}
export function baseURL(){const url=new URL(required('SITE_URL'));if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('SITE_URL precisa de HTTPS');return url.origin;}
export function noStore(res){res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');}
export function fail(res,status,message){noStore(res);return res.status(status).json({error:message});}
function signingSecret(){const secret=required('DOWNLOAD_SIGNING_SECRET');if(Buffer.byteLength(secret)<32)throw new Error('Segredo de download muito curto');return secret;}
export function makeToken(sid,expires){const value=Buffer.from(JSON.stringify({sid,expires})).toString('base64url');return value+'.'+createHmac('sha256',signingSecret()).update(value).digest('base64url');}
export function readToken(token,now=Math.floor(Date.now()/1000)){
 if(typeof token!=='string'||token.length>2048)throw new Error('Link inválido');
 const [value,signature,...rest]=token.split('.');
 const expected=createHmac('sha256',signingSecret()).update(value||'').digest();
 const supplied=Buffer.from(signature||'','base64url');
 if(rest.length||supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new Error('Link inválido');
 const data=JSON.parse(Buffer.from(value,'base64url').toString());
 if(!/^cs_test_[A-Za-z0-9]+$/.test(data.sid)||!Number.isSafeInteger(data.expires)||data.expires<=now)throw new Error('Link expirado ou inválido');
 return data;
}
export async function paidOrder(client,sid){
 if(typeof sid!=='string'||!/^cs_test_[A-Za-z0-9]+$/.test(sid))throw new Error('Sessão inválida');
 const session=await client.checkout.sessions.retrieve(sid,{expand:['payment_intent.latest_charge']});
 if(session.livemode||session.mode!=='payment'||session.status!=='complete'||session.payment_status!=='paid')throw new Error('Pagamento ainda não confirmado');
 const items=await client.checkout.sessions.listLineItems(sid,{limit:2});
 const key=session.metadata?.product;const product=catalog[key];const price=items.data[0]?.price;
 if(!product||items.has_more||items.data.length!==1||items.data[0].quantity!==1||price?.id!==required(product.priceEnv)||session.currency!=='brl'||session.amount_total!==product.amount)throw new Error('Pedido não reconhecido');
 const charge=session.payment_intent?.latest_charge;
 if(!charge||typeof charge==='string'||charge.refunded||charge.amount_refunded>0||charge.disputed)throw new Error('Pagamento indisponível');
 return {session,key,product};
}
export function downloadURL(session){const expires=session.created+7*24*3600;return baseURL()+'/api/download?token='+encodeURIComponent(makeToken(session.id,expires));}
export async function signedPDF(key){
 const client=new S3Client({region:required('S3_REGION'),endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',credentials:{accessKeyId:required('S3_ACCESS_KEY_ID'),secretAccessKey:required('S3_SECRET_ACCESS_KEY')}});
 return getSignedUrl(client,new GetObjectCommand({Bucket:required('S3_BUCKET'),Key:required(catalog[key].fileEnv),ResponseContentDisposition:`attachment; filename="${key==='ebook'?'ebook-lado-b':'guia-perfil-ia'}.pdf"`,ResponseContentType:'application/pdf'}),{expiresIn:300});
}
export async function fulfill(client,sid){
 const {session,product}=await paidOrder(client,sid);
 const email=session.customer_details?.email;if(!email)throw new Error('Pedido sem e-mail');
 // Verifica a configuração antes de tomar o bloqueio persistente.
 const apiKey=required('RESEND_API_KEY'),from=required('EMAIL_FROM');
 const redis=new Redis({url:required('UPSTASH_REDIS_REST_URL'),token:required('UPSTASH_REDIS_REST_TOKEN')});
 const record='delivery:'+sid;const state=await redis.get(record);if(state==='sent')return;
 const lock=await redis.set(record,'sending',{nx:true,ex:120});if(!lock)throw new Error('Entrega em processamento; repetir evento');
 try{
  const link=downloadURL(session);
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`delivery-${sid}`},body:JSON.stringify({from,to:[email],subject:'Seu PDF do Lado B do Mercado',text:`Seu pagamento de teste foi confirmado.\n\n${product.title}\nBaixe o PDF: ${link}\n\nO link expira 7 dias após a criação do checkout. Suporte: WhatsApp (13) 99121-3068.\nConteúdo informativo e educacional. Não é recomendação de investimento.`})});
  if(!response.ok)throw new Error('Falha no serviço de e-mail');
  // Sem TTL: a marcação evita reenvio em replays tardios do webhook.
  await redis.set(record,'sent');
 }catch(error){await redis.del(record);throw error;}
}
