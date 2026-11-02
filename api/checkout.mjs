import {stripe,catalog,required,baseURL,noStore,fail,liveMode} from '../lib/commerce.mjs';
export default async function handler(req,res){
 noStore(res);if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(res,405,'Use POST');}
 try{
  if(req.headers.origin!==baseURL())return fail(res,403,'Origem não permitida');
  if(!req.headers['content-type']?.includes('application/json'))return fail(res,415,'Envie JSON');
  const key=req.body?.product,product=catalog[key];if(!product)return fail(res,400,'Produto inválido');
  const client=stripe();const price=await client.prices.retrieve(required(product.priceEnv));
  if(!price.active||price.livemode!==liveMode()||price.currency!=='brl'||price.unit_amount!==product.amount||price.type!=='one_time')throw new Error('Preço incompatível');
  const origin=baseURL();
  const session=await client.checkout.sessions.create({mode:'payment',locale:'pt-BR',branding_settings:{display_name:'Lado B do Mercado',background_color:'#0B0D11',button_color:'#FFC629',font_family:'montserrat',border_style:'rounded',logo:{type:'url',url:origin+'/assets/checkout-logo.png'},icon:{type:'url',url:origin+'/assets/checkout-icon.png'}},payment_method_types:['card','pix'],payment_method_options:{pix:{expires_after_seconds:3600}},line_items:[{price:price.id,quantity:1}],metadata:{product:key},billing_address_collection:'auto',success_url:origin+'/obrigado.html?session_id={CHECKOUT_SESSION_ID}',cancel_url:origin+'/#produtos'});
  return res.json({url:session.url});
 }catch(error){console.error('checkout:',error.type||error.name);return fail(res,503,'O checkout ainda não está disponível. Fale com a NexoFrame pelo WhatsApp.');}
}
