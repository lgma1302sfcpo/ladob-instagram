import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('output/screenshots',{recursive:true});
const ownServer=process.env.QA_START_SERVER==='1'?(await import('./dev.mjs')).server:null;
const browser=await chromium.launch({headless:true,channel:'msedge'});const errors=[];const results=[];
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({reducedMotion:'reduce'});
 await page.screenshot({path:`output/screenshots/${name}-hero.png`});
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}window.scrollTo(0,0);});
 await page.screenshot({path:`output/screenshots/${name}-full.png`,fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.locator('summary').first().click();const faq=await page.locator('details').first().getAttribute('open');
 await page.getByRole('button',{name:/Quero o e-book ·/}).click();await page.getByText('Checkout indisponível',{exact:true}).waitFor();const dialog=await page.locator('#checkout-dialog').isVisible();await page.getByRole('button',{name:'Entendi'}).click();
 await page.goto('http://localhost:3000/obrigado.html');await page.getByText('Aguardando confirmação.',{exact:true}).waitFor();const falseDownload=await page.locator('#download').isVisible();
 results.push({name,status:response.status(),overflow,faq:faq!==null,checkoutMissingConfigMessage:dialog,invalidSessionDownloadHidden:!falseDownload});await page.close();
}
await browser.close();ownServer?.close();await writeFile('output/qa.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));if(errors.length||results.some(r=>r.overflow||!r.faq||!r.invalidSessionDownloadHidden))process.exitCode=1;
