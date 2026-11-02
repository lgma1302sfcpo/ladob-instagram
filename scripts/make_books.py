import json, math, html, re
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
FONTS=ROOT/'public/assets'
regular=FONTS/'Montserrat-Medium.ttf'; bold=FONTS/'Montserrat-Black.ttf'
pdfmetrics.registerFont(TTFont('Body',str(regular) if regular.exists() else 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Head',str(bold) if bold.exists() else 'C:/Windows/Fonts/arialbd.ttf'))
W,H=595.28,841.89
YELLOW='#FFC629'; BG='#0B0D11'; WHITE='#F6F5F0'; MUTED='#B4B9C4'
style=ParagraphStyle('body',fontName='Body',fontSize=11.5,leading=18.5,textColor=HexColor(WHITE),spaceAfter=13)
class Book:
 def __init__(self,name,title):
  self.name=name; self.title=title; self.c=canvas.Canvas(str(OUT/(name+'.pdf')),pagesize=(W,H)); self.n=0; self.html=[]; self.y=0
  self.c.setTitle(title); self.c.setAuthor('Lado B do Mercado')
 def cover(self,guide=False):
  self.page('Guia prático / R$ 97' if guide else 'E-book / R$ 19','')
  c=self.c;c.setFillColor(HexColor(YELLOW if guide else BG));c.rect(0,0,W,H,fill=1,stroke=0)
  ink=HexColor(BG if guide else WHITE);accent=HexColor(BG if guide else YELLOW)
  c.setFillColor(ink);c.setFont('Head',11);c.drawString(46,H-56,'LADO B DO MERCADO  /  '+('GUIA' if guide else 'E-BOOK'))
  c.setStrokeColor(ink);c.setLineWidth(.7);c.line(46,H-79,W-46,H-79)
  if guide:
   c.setFont('Head',69)
   for i,line in enumerate(['PERFIL','COM IA','DO ZERO.']):c.drawString(40,H-190-i*80,line)
   c.setStrokeColor(ink);c.setLineWidth(16);p=c.beginPath();p.moveTo(352,248);p.lineTo(515,411);p.lineTo(404,411);p.moveTo(515,411);p.lineTo(515,300);c.drawPath(p)
   c.setFont('Body',15);c.drawString(46,197,'Como criar vídeos curtos que viralizam');c.drawString(46,174,'sem aparecer.');c.setFont('Body',10);c.drawString(46,116,'Viralização não é garantida. Um processo para testar e melhorar.')
  else:
   c.setFont('Head',78);c.drawString(40,H-195,'LADO B.');c.setFillColor(accent);c.setFont('Head',225);c.drawString(32,H-430,'20')
   c.setFont('Head',27);c.drawString(46,345,'EMPRESAS QUE');c.drawString(46,309,'QUASE QUEBRARAM');c.setFillColor(ink);c.setFont('Body',15);c.drawString(46,270,'(e o que aconteceu de verdade)')
   c.setStrokeColor(accent);c.setLineWidth(2.5);p=c.beginPath();p.moveTo(0,157)
   for x,y in [(55,180),(92,149),(140,210),(181,186),(230,225),(280,170),(330,191),(380,118),(422,150),(475,110),(528,169),(595,206)]:p.lineTo(x,y)
   c.drawPath(p)
  c.setFont('Body',8);c.setFillColor(ink);c.drawString(46,55,'@ladobdomercado  /  FONTES ABERTAS. OUTRA PERSPECTIVA.')
  self.y=60;self.html.append('<h1>'+html.escape(self.title)+'</h1>')
 def page(self,section,title,light=False):
  if self.n:self.end()
  self.n+=1; self.light=light; c=self.c
  c.setFillColor(HexColor('#FFFFFF' if light else BG)); c.rect(0,0,W,H,fill=1,stroke=0)
  c.setFillColor(HexColor(YELLOW)); c.rect(40,H-43,28,4,fill=1,stroke=0)
  c.setFont('Body',8); c.setFillColor(HexColor('#333333' if light else MUTED)); c.drawString(80,H-44,'LADO B DO MERCADO  /  '+section.upper())
  self.y=H-93; self.html.append('<section><small>'+html.escape(section)+'</small>'); self.heading(title,25)
 def heading(self,text,size=15):
  self.para(text,size,True); self.html.append('<h2>'+html.escape(text)+'</h2>')
 def para(self,text,size=11.5,head=False):
  st=ParagraphStyle('p',parent=style,fontName='Head' if head else 'Body',fontSize=size,leading=size*1.48,textColor=HexColor('#16181E' if self.light else (YELLOW if head else WHITE)))
  p=Paragraph(html.escape(str(text)).replace('\n','<br/>'),st); _,h=p.wrap(W-88,H)
  if self.y-h<58:raise ValueError(f'Overflow {self.name} page {self.n}, y={self.y}, h={h}, text={str(text)[:70]}')
  p.drawOn(self.c,44,self.y-h); self.y-=h+13
  if not head:self.html.append('<p>'+html.escape(str(text)).replace('\n','<br>')+'</p>')
 def source(self,s):
  st=ParagraphStyle('s',parent=style,fontSize=8,leading=11,textColor=HexColor(MUTED),splitLongWords=True)
  text=html.escape(s['title'])+'<br/><link href="'+html.escape(s['url'],quote=True)+'" color="#FFC629">'+html.escape(s['url'])+'</link>'
  p=Paragraph(text,st); _,h=p.wrap(W-88,H)
  if self.y-h<58:raise ValueError(f'Source overflow {self.name} p{self.n}')
  p.drawOn(self.c,44,self.y-h); self.y-=h+10
  self.html.append('<p class="source"><a href="'+html.escape(s['url'],quote=True)+'">'+html.escape(s['title'])+'</a></p>')
 def chart(self):
  c=self.c;c.setStrokeColor(HexColor('#303641'));c.setLineWidth(.5)
  for y in range(150,430,35):c.line(44,y,W-44,y)
  p=c.beginPath();p.moveTo(44,220)
  for i in range(1,30):p.lineTo(44+i*17,220+math.sin(i*.5)*45+i*4)
  c.setLineWidth(3);c.setStrokeColor(HexColor(YELLOW));c.drawPath(p)
  c.setFillColor(HexColor(MUTED));c.setFont('Body',8);c.drawString(44,126,'ILUSTRAÇÃO EDITORIAL. NÃO REPRESENTA COTAÇÕES REAIS.')
 def end(self):
  c=self.c;c.setFont('Body',8);c.setFillColor(HexColor('#444444' if self.light else MUTED));c.drawString(44,30,'@ladobdomercado  |  Edição de pesquisa - 02/11/2026');c.drawRightString(W-44,30,f'{self.n:02}');c.showPage();self.html.append('</section>')
 def save(self):
  self.end();self.c.save()
  css='@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#0B0D11;color:#F6F5F0;font:15px/1.6 Montserrat,Arial}section{width:210mm;min-height:297mm;padding:18mm;break-after:page}h2{color:#FFC629;line-height:1.25}small,.source{font-size:11px;color:#B4B9C4}a{color:#FFC629} @media screen{section{margin:auto;border-bottom:1px solid #333}}'
  (ROOT/'content'/(self.name+'.html')).write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>'+html.escape(self.title)+'</title><style>'+css+'</style>'+''.join(self.html)+'</html>',encoding='utf-8')
  print(self.name,self.n,'pages')
def ebook():
 cases=json.loads((ROOT/'content/research-brasil.json').read_text(encoding='utf-8'))+json.loads((ROOT/'content/research-international.json').read_text(encoding='utf-8'))
 assert len(cases)==20
 b=Book('ebook-lado-b','Lado B: 20 empresas que quase quebraram (e o que aconteceu de verdade)')
 b.cover()
 b.page('Antes de começar','O que você vai encontrar')
 b.para('Conteúdo informativo e educacional. Não é recomendação de investimento.')
 b.para('Este livro reúne crises empresariais, falências e reestruturações. O título usa “quase quebraram” como convite à leitura: alguns negócios se recuperaram; outros efetivamente entraram em processos de insolvência. Não são vinte finais felizes.')
 b.para('Cada caso distingue o fato documentado da leitura editorial em “O lado B”. Não há recomendações sobre ações, preços-alvo ou promessas de retorno. As lições são interpretações sobre empresas e informação.')
 b.para('As fontes aparecem ao final de cada capítulo. O recorte temporal é informado caso a caso. “O que aconteceu depois” é o último marco documentado aqui, não uma certidão da situação atual. Não fazemos imputações criminais individuais.')
 b.para('Edição de pesquisa: 2 de novembro de 2026. Revise fatos novos e o conteúdo antes de iniciar as vendas. Para documentos judiciais, notícia e decisão não substituem consulta aos autos.')
 for start in (0,10):
  b.page('Mapa de leitura', 'As histórias / '+('01 a 10' if start==0 else '11 a 20'))
  for i,x in enumerate(cases[start:start+10],start):b.para(f'{i+1:02}. {x["name"]}  /  página {5+i*2}',13)
 for i,x in enumerate(cases):
  b.page(f'Caso {i+1:02} / a crise',x['name']);b.heading(x['hook'],20);b.heading('A ascensão');b.para(x['rise']);b.heading('O erro ou a crise');b.para(x['crisis'])
  b.page(f'Caso {i+1:02} / o desfecho','O que aconteceu depois');b.para(x['after']);b.heading('O lado B');b.para(x['lesson']);
  if x.get('note'):b.para(x['note'],9)
  b.heading('Fontes e recorte',12)
  for s in x['sources']:b.source(s)
 b.page('Continue a conversa','Histórias que merecem uma segunda leitura.');b.para('Quer receber histórias assim toda semana? Siga @ladobdomercado.');b.para('Instagram e TikTok: procure o mesmo nome. Acompanhe as publicações e consulte as fontes que acompanham cada história.');b.source(dict(title='Instagram / @ladobdomercado',url='https://www.instagram.com/ladobdomercado/'));b.chart()
 nexo(b); b.save()
def nexo(b):
 b.page('NexoFrame IA','Tem uma empresa? A gente cria pra você.');b.heading('Vídeos para as redes');b.para('Roteiro, identidade visual e edição para contar o que sua empresa faz.');b.heading('Sites');b.para('Páginas que apresentam sua oferta de forma clara, no celular e no computador.');b.heading('Sistemas');b.para('Ferramentas para organizar tarefas e reduzir trabalho repetitivo.');b.heading('Vamos conversar?');b.para('NexoFrame IA · WhatsApp (13) 99121-3068');b.source(dict(title='Chamar no WhatsApp',url='https://wa.me/5513991213068?text=Ol%C3%A1!%20Vim%20pelo%20Lado%20B%20do%20Mercado%20e%20quero%20saber%20sobre%20v%C3%ADdeo%2C%20site%20ou%20sistema.'))
def guide():
 pages=json.loads((ROOT/'content/guide.json').read_text(encoding='utf-8'))
 if isinstance(pages,dict):pages=pages['pages']
 b=Book('guia-perfil-ia','Perfil com IA do zero: como criar vídeos curtos que viralizam sem aparecer')
 b.cover(guide=True)
 for p in pages:
  b.page(p['section'],p['title'],light='checklist' in p['section'].lower() and 'imprimir' in p['section'].lower())
  for t in p.get('body',[]):b.para(t)
  for i,t in enumerate(p.get('steps',[])):b.para(f'{i+1:02}. {t}',10.5)
  if p.get('prompt'):b.para(p['prompt'],10)
  if p.get('print'):b.para(p['print'] if p['print'].startswith('[PRINT:') else '[PRINT: '+p['print']+']',9)
  for s in p.get('sources',[]):b.source(s)
 nexo(b);b.save()
if __name__=='__main__':
 import sys
 if len(sys.argv)==1 or 'ebook' in sys.argv:ebook()
 if len(sys.argv)==1 or 'guide' in sys.argv:guide()
