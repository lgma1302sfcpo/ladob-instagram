import {stripe,readToken,paidOrder,signedPDF,noStore,fail} from '../lib/commerce.mjs';
export default async function handler(req,res){
 noStore(res);if(req.method!=='GET')return fail(res,405,'Use GET');
 try{const {sid}=readToken(req.query.token);const {key}=await paidOrder(stripe(),sid);return res.redirect(302,await signedPDF(key));}
 catch{return fail(res,403,'Link indisponível ou expirado. Solicite suporte no WhatsApp (13) 99121-3068.');}
}
