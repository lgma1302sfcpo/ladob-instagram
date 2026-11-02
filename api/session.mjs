import {stripe,paidOrder,downloadURL,noStore,fail} from '../lib/commerce.mjs';
export default async function handler(req,res){
 noStore(res);if(req.method!=='GET')return fail(res,405,'Use GET');
 try{const {session,product}=await paidOrder(stripe(),req.query.session_id);return res.json({paid:true,title:product.title,download:downloadURL(session)});}
 catch{return fail(res,409,'O pagamento ainda não foi confirmado ou a sessão não é válida. Aguarde e tente de novo.');}
}
