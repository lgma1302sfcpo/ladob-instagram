// Executar somente após autorização do titular e fornecimento seguro da chave real.
// Nunca recebe ou imprime segredos por argumentos da linha de comando.
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import Stripe from 'stripe';
import {catalog} from '../lib/commerce.mjs';

const file='.env.live.local';
let raw=await readFile(file,'utf8');const env=parseEnv(raw);
const testEnv=parseEnv(await readFile('.env.local','utf8'));
const site='https://ladob-instagram.vercel.app';
function setEnv(key,value){
 if(typeof value!=='string'||/[\r\n]/.test(value))throw Error('Valor de ambiente inválido');
 raw=raw.replace(new RegExp('^'+key+'=.*\\r?\\n?','gm'),'');raw+='\n'+key+'='+value+'\n';env[key]=value;
}
async function persist(){await writeFile(file,raw,{mode:0o600});}
if(!/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY||''))throw Error('Chave de produção ausente');
const client=new Stripe(env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:15000});
const account=await client.accounts.retrieve();
if(account.id!=='acct_1UOR1EB3AYgx9eJV')throw Error('Conta Stripe divergente');
if(!account.charges_enabled)throw Error('A Stripe ainda não habilitou cobranças reais nesta conta');
setEnv('STRIPE_MODE','live');setEnv('SITE_URL',site);
for(const [key,product] of Object.entries(catalog)){
 const lookup=`ladob_${key}_v1`;
 const found=env[product.priceEnv]?null:await client.prices.list({lookup_keys:[lookup],limit:1});
 let price=env[product.priceEnv]?await client.prices.retrieve(env[product.priceEnv]):found.data[0];
 if(!price){
  const p=await client.products.create({name:product.title,metadata:{brand:'ladobdomercado',key}},{idempotencyKey:`ladob-live-product-${key}-v1`});
  price=await client.prices.create({product:p.id,currency:'brl',unit_amount:product.amount,lookup_key:lookup},{idempotencyKey:`ladob-live-price-${key}-v1`});
 }
 if(!price.livemode||!price.active||price.currency!=='brl'||price.unit_amount!==product.amount||price.type!=='one_time')throw Error('Preço real incompatível');
 setEnv(product.priceEnv,price.id);await persist();
}
const url=site+'/api/webhook';const endpoints=await client.webhookEndpoints.list({limit:100});
if(endpoints.has_more)throw Error('Mais de 100 webhooks: revise a configuração manualmente');
let webhook=endpoints.data.find(e=>e.url===url);
if(webhook){
 if(!env.STRIPE_WEBHOOK_SECRET||env.STRIPE_WEBHOOK_ID!==webhook.id)throw Error('Endpoint existente: recupere seu segredo no painel antes de continuar');
 webhook=await client.webhookEndpoints.update(webhook.id,{enabled_events:['checkout.session.completed','checkout.session.async_payment_succeeded']});
}else{
 webhook=await client.webhookEndpoints.create({url,description:'Lado B do Mercado - entrega digital',enabled_events:['checkout.session.completed','checkout.session.async_payment_succeeded']});
 setEnv('STRIPE_WEBHOOK_SECRET',webhook.secret);setEnv('STRIPE_WEBHOOK_ID',webhook.id);await persist();
}
if(!webhook.livemode||webhook.status!=='enabled')throw Error('Webhook real indisponível');
if(!env.DOWNLOAD_SIGNING_SECRET)setEnv('DOWNLOAD_SIGNING_SECRET',randomBytes(32).toString('hex'));
for(const key of ['BLOB_READ_WRITE_TOKEN','BLOB_PATH_EBOOK','BLOB_PATH_GUIA'])if(!env[key]&&testEnv[key])setEnv(key,testEnv[key]);
if(!env.BLOB_READ_WRITE_TOKEN)throw Error('Armazenamento privado ausente');await persist();
const project=JSON.parse(await readFile('.vercel/project.json','utf8'));
if(project.projectId!=='prj_ZJE2MUNDMApzzzL2mHLe6D1MQ3oA')throw Error('Projeto Vercel divergente');
const auth=JSON.parse(await readFile(join(process.env.APPDATA,'com.vercel.cli','Data','auth.json'),'utf8'));
const names=['SITE_URL','STRIPE_MODE','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_EBOOK','STRIPE_PRICE_GUIA','DOWNLOAD_SIGNING_SECRET','BLOB_READ_WRITE_TOKEN','BLOB_PATH_EBOOK','BLOB_PATH_GUIA'];
const values=names.filter(key=>env[key]).map(key=>({key,value:env[key],type:'encrypted',target:['production']}));
const headers={Authorization:'Bearer '+auth.token,'Content-Type':'application/json'};
async function vercel(path,method='GET',body){
 const response=await fetch('https://api.vercel.com'+path+'?teamId='+project.orgId,{method,headers,body:body?JSON.stringify(body):undefined});
 if(!response.ok)throw Error('Falha no ambiente Vercel, HTTP '+response.status);
 return response.json();
}
const remote=await vercel('/v10/projects/'+project.projectId+'/env');
for(const value of values){
 const existing=remote.envs.filter(e=>e.key===value.key&&e.target?.includes('production'));
 if(existing.length>1)throw Error('Mais de uma variável Production para '+value.key);
 const current=existing[0];const otherTargets=current?.target.filter(t=>t!=='production')||[];
 if(current&&otherTargets.length){
  // Preserve o valor de teste nos outros ambientes antes de criar o valor real separado.
  await vercel('/v9/projects/'+project.projectId+'/env/'+current.id,'PATCH',{target:otherTargets});
  await vercel('/v10/projects/'+project.projectId+'/env','POST',value);
 }else if(current){await vercel('/v9/projects/'+project.projectId+'/env/'+current.id,'PATCH',value);}
 else{await vercel('/v10/projects/'+project.projectId+'/env','POST',value);}
}
console.log(JSON.stringify({mode:'live',account:account.id,chargesEnabled:account.charges_enabled,prices:{ebook:env.STRIPE_PRICE_EBOOK,guia:env.STRIPE_PRICE_GUIA},webhook:{id:webhook.id,url:webhook.url,status:webhook.status},vercelProject:project.projectId,environment:'production',configuredVariables:values.map(v=>v.key)},null,2));
