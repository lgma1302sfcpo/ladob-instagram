import {test} from 'node:test';import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {makeToken,readToken,paidOrder,stripe,fulfill} from '../lib/commerce.mjs';
import webhook from '../api/webhook.mjs';
import {Readable} from 'node:stream';
process.env.DOWNLOAD_SIGNING_SECRET='test-only-secret-32-characters-long-123';
process.env.STRIPE_PRICE_EBOOK='price_ebook';process.env.STRIPE_PRICE_GUIA='price_guia';
const sid='cs_test_abcd1234';
function mock(overrides={},items=[{price:{id:'price_ebook'},quantity:1}]){return {checkout:{sessions:{retrieve:async()=>({id:sid,livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'brl',amount_total:1900,metadata:{product:'ebook'},payment_intent:{latest_charge:{refunded:false,amount_refunded:0,disputed:false}},...overrides}),listLineItems:async()=>({data:items,has_more:false})}}};}
test('link válido, adulterado e expirado',()=>{const token=makeToken(sid,200);assert.equal(readToken(token,100).sid,sid);assert.throws(()=>readToken(token,200));assert.throws(()=>readToken(token+'x',100));assert.throws(()=>readToken(makeToken('cs_live_x',200),100));});
test('pedido pago libera somente o produto comprado',async()=>{assert.equal((await paidOrder(mock(),sid)).key,'ebook');await assert.rejects(paidOrder(mock({metadata:{product:'guia'}}),sid));});
test('pendente, reembolsado, contestado e valor alterado não liberam',async()=>{for(const overrides of [{payment_status:'unpaid'},{amount_total:1},{currency:'usd'},{livemode:true},{payment_intent:{latest_charge:{refunded:true}}},{payment_intent:{latest_charge:{amount_refunded:1}}},{payment_intent:{latest_charge:{disputed:true}}}])await assert.rejects(paidOrder(mock(overrides),sid));});
test('linha extra, preço trocado e quantidade alterada não liberam',async()=>{for(const items of [[{price:{id:'other'},quantity:1}],[{price:{id:'price_ebook'},quantity:2}],[{price:{id:'price_ebook'},quantity:1},{price:{id:'price_guia'},quantity:1}]])await assert.rejects(paidOrder(mock({},items),sid));});
test('chaves de produção são recusadas',()=>{process.env.STRIPE_SECRET_KEY='sk_live_example';assert.throws(()=>stripe());process.env.STRIPE_SECRET_KEY='sk_test_example';});
function res(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
test('webhook rejeita assinatura inválida sem chamar rede',async()=>{process.env.STRIPE_SECRET_KEY='sk_test_example';process.env.STRIPE_WEBHOOK_SECRET='whsec_test';const req=Readable.from([Buffer.from('{}')]);req.method='POST';req.headers={'stripe-signature':'invalid'};const r=res();await webhook(req,r);assert.equal(r.code,400);});
test('webhook Pix pendente assinado não entrega o PDF',async()=>{const s=new Stripe('sk_test_example');const payload=JSON.stringify({id:'evt_x',livemode:false,type:'checkout.session.completed',data:{object:{id:sid,payment_status:'unpaid'}}});const req=Readable.from([Buffer.from(payload)]);req.method='POST';req.headers={'stripe-signature':s.webhooks.generateTestHeaderString({payload,secret:'whsec_test'})};const r=res();await webhook(req,r);assert.equal(r.body.pending,true);});
test('pagamento confirmado registra download e replay não repete a operação',async()=>{
 const client=mock();let metadata={product:'ebook'},updates=0;
 const retrieve=client.checkout.sessions.retrieve;client.checkout.sessions.retrieve=async()=>({...await retrieve(),metadata});
 client.checkout.sessions.update=async(id,body,options)=>{updates++;assert.equal(options.idempotencyKey,'download-ready-'+sid);metadata={...metadata,...body.metadata};return {id,metadata};};
 await fulfill(client,sid);assert.equal(metadata.download_ready,'true');assert.equal(metadata.delivery_method,'download');await fulfill(client,sid);assert.equal(updates,1);
});
test('pagamento pendente não registra disponibilização de download',async()=>{
 const client=mock({payment_status:'unpaid'});let updates=0;client.checkout.sessions.update=async()=>{updates++;};
 await assert.rejects(fulfill(client,sid));assert.equal(updates,0);
});
