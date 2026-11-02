import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {parseEnv} from 'node:util';
import Stripe from 'stripe';

const file='.env.local';let raw=await readFile(file,'utf8');const env=parseEnv(raw);
function setEnv(key,value){if(/[\r\n]/.test(value))throw Error('Valor inválido');raw=raw.replace(new RegExp('^'+key+'=.*\\r?\\n?','gm'),'');raw+='\n'+key+'='+value+'\n';env[key]=value;}
const secret=env.STRIPE_SECRET_KEY;
if(!secret?.startsWith('sk_test_'))throw Error('Somente chave de teste é aceita');
const stripe=new Stripe(secret);const account=await stripe.accounts.retrieve();
if(account.id!=='acct_1UOR1EB3AYgx9eJV')throw Error('Conta Stripe divergente');
for(const [key,priceEnv,amount] of [['ebook','STRIPE_PRICE_EBOOK',1900],['guia','STRIPE_PRICE_GUIA',9700]]){
 const price=await stripe.prices.retrieve(env[priceEnv]);
 if(price.livemode||price.currency!=='brl'||price.type!=='one_time'||price.unit_amount!==amount)throw Error('Preço divergente');
 await stripe.prices.update(price.id,{lookup_key:'ladob_'+key+'_v1'});
 await stripe.products.update(price.product,{metadata:{brand:'ladobdomercado',key}});
}
const site='https://ladob-instagram.vercel.app';setEnv('SITE_URL',site);
setEnv('STRIPE_MODE','test');
const url=site+'/api/webhook';const endpoints=await stripe.webhookEndpoints.list({limit:100});
let webhook=endpoints.data.find(e=>e.url===url);
if(webhook){if(!env.STRIPE_WEBHOOK_SECRET)throw Error('Webhook já existe, mas o segredo não está no arquivo local. Recupere-o no Dashboard.');}
else{webhook=await stripe.webhookEndpoints.create({url,description:'Lado B do Mercado - entrega digital - TESTE',enabled_events:['checkout.session.completed','checkout.session.async_payment_succeeded']});setEnv('STRIPE_WEBHOOK_SECRET',webhook.secret);}
if(webhook.livemode)throw Error('Webhook de produção não permitido');
await writeFile(file,raw);

const project=JSON.parse(await readFile('.vercel/project.json','utf8'));
const auth=JSON.parse(await readFile(join(process.env.APPDATA,'com.vercel.cli','Data','auth.json'),'utf8'));
const names=['SITE_URL','STRIPE_MODE','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_EBOOK','STRIPE_PRICE_GUIA','DOWNLOAD_SIGNING_SECRET'];
const values=names.map(key=>({key,value:env[key],type:'encrypted',target:['preview','development']}));
const response=await fetch('https://api.vercel.com/v10/projects/'+project.projectId+'/env?teamId='+project.orgId+'&upsert=true',{method:'POST',headers:{Authorization:'Bearer '+auth.token,'Content-Type':'application/json'},body:JSON.stringify(values)});
if(!response.ok){console.error('Falha ao configurar ambiente Vercel, HTTP',response.status);process.exit(1);}
console.log(JSON.stringify({account:account.id,mode:'test',webhook:{id:webhook.id,url:webhook.url,events:webhook.enabled_events},vercelProject:project.projectId,configuredVariables:names},null,2));
