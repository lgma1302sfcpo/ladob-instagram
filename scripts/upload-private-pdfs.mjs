import {readFile} from 'node:fs/promises';import {put,get} from '@vercel/blob';import {createHash} from 'node:crypto';
const token=process.env.BLOB_READ_WRITE_TOKEN;if(!token)throw Error('Configure BLOB_READ_WRITE_TOKEN');
for(const name of ['ebook-lado-b','guia-perfil-ia']){
 const data=await readFile('output/pdf/'+name+'.pdf');const pathname='products/'+name+'.pdf';
 await put(pathname,data,{token,access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/pdf'});
 const received=await get(pathname,{token,access:'private',useCache:false});
 if(received?.statusCode!==200)throw Error('Falha ao verificar PDF privado');
 const bytes=Buffer.from(await new Response(received.stream).arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!==createHash('sha256').update(data).digest('hex'))throw Error('Hash do PDF diverge');
 console.log(JSON.stringify({pathname,size:data.length,private:true,hashVerified:true}));
}
