import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('public');const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.png':'image/png','.ttf':'font/ttf'};
export const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost:3000');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(url.pathname.startsWith('/api/')){
  const name=url.pathname.slice(5);if(!['checkout','webhook','session','download','payment-config'].includes(name)){res.writeHead(404).end();return;}
  req.query=Object.fromEntries(url.searchParams);if(name!=='webhook'&&req.method==='POST'){let data='';for await(const c of req){data+=c;if(data.length>4096){res.writeHead(413).end();return;}}try{req.body=JSON.parse(data);}catch{res.writeHead(400).end();return;}}
  res.status=function(n){this.statusCode=n;return this;};res.json=function(v){this.setHeader('Content-Type','application/json');this.end(JSON.stringify(v));return this;};res.redirect=function(n,u){this.writeHead(n,{Location:u});this.end();};
  return (await import('../api/'+name+'.mjs')).default(req,res);
 }
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(!(await stat(file)).isFile())throw new Error('404');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404).end('Página não encontrada');}}).listen(3000,'127.0.0.1',()=>console.log('Local: http://localhost:3000'));
