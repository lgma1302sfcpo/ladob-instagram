import {stripe,required,fulfill,noStore,fail} from '../lib/commerce.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 noStore(res);if(req.method!=='POST')return fail(res,405,'Use POST');
 let client,event;
 try{client=stripe();const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)return fail(res,413,'Evento muito grande');chunks.push(chunk);}event=client.webhooks.constructEvent(Buffer.concat(chunks),req.headers['stripe-signature'],required('STRIPE_WEBHOOK_SECRET'));}
 catch{return fail(res,400,'Assinatura ou configuração inválida');}
 if(event.livemode)return fail(res,400,'Somente modo de teste');
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
  // Pix pode completar o checkout antes da confirmação financeira.
  if(event.data.object.payment_status!=='paid')return res.json({received:true,pending:true});
  try{await fulfill(client,event.data.object.id);}catch(error){console.error('fulfillment:',error.name);return fail(res,500,'Entrega pendente; repetir evento');}
 }
 return res.json({received:true});
}
