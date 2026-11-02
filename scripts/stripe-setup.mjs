import {stripe,catalog} from '../lib/commerce.mjs';
const client=stripe();
for(const [key,product] of Object.entries(catalog)){
 const configured=process.env[product.priceEnv];
 const found=configured?null:await client.prices.list({lookup_keys:[`ladob_${key}_v1`],limit:1});
 let price=configured?await client.prices.retrieve(configured):found.data[0];
 if(!price){
  const p=await client.products.create({name:product.title,metadata:{brand:'ladobdomercado',key}},{idempotencyKey:`ladob-product-${key}-v1`});
  price=await client.prices.create({product:p.id,currency:'brl',unit_amount:product.amount,lookup_key:`ladob_${key}_v1`},{idempotencyKey:`ladob-price-${key}-v1`});
 }
 if(price.livemode||price.unit_amount!==product.amount||price.currency!=='brl')throw new Error('Preço incompatível');
 console.log(`${product.priceEnv}=${price.id}`);
}
