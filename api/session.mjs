import {stripe,paidOrder,downloadURL,noStore,fail} from '../lib/commerce.mjs';
import {Redis} from '@upstash/redis';
export default async function handler(req,res){
 noStore(res);if(req.method!=='GET')return fail(res,405,'Use GET');
 try{const {session,product}=await paidOrder(stripe(),req.query.session_id);let delivered=false;try{const redis=Redis.fromEnv();delivered=await redis.get('delivery:'+session.id)==='sent';}catch{}return res.json({paid:true,delivered,title:product.title,download:downloadURL(session)});}
 catch{return fail(res,409,'O pagamento ainda não foi confirmado ou a sessão não é válida. Aguarde e tente de novo.');}
}
