import {signedPDF} from '../lib/commerce.mjs';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
for(const [key,name] of [['ebook','ebook-lado-b'],['guia','guia-perfil-ia']]){
 const signed=await signedPDF(key),url=new URL(signed);const r=await fetch(signed);const bytes=Buffer.from(await r.arrayBuffer());
 const expected=await readFile('output/pdf/'+name+'.pdf');
 if(r.status!==200||createHash('sha256').update(bytes).digest('hex')!==createHash('sha256').update(expected).digest('hex'))throw Error('Download privado diverge');
 url.search='';const denied=await fetch(url);
 if(denied.status===200)throw Error('PDF acessível sem assinatura');
 console.log(JSON.stringify({product:key,signedDownloadStatus:r.status,hashVerified:true,unsignedStatus:denied.status}));
}
