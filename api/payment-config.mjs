import {liveMode,noStore,fail} from '../lib/commerce.mjs';
export default function handler(req,res){
 noStore(res);if(req.method!=='GET')return fail(res,405,'Use GET');
 try{return res.json({mode:liveMode()?'live':'test'});}catch{return fail(res,503,'Configuração indisponível');}
}
