from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import os
root=Path(__file__).resolve().parents[1]
target=root.parent/'lado-b-projeto.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as z:
 for current,dirs,files in os.walk(root):
  dirs[:]=[d for d in dirs if d not in ('node_modules','.git','.vercel','__pycache__','tmp')]
  for name in files:
   f=Path(current)/name;rel=f.relative_to(root)
   if name.startswith('.env') and name!='.env.example':continue
   if rel.parts[0]=='private' and name!='LEIA-ME.md':continue
   if str(rel).replace('\\','/').startswith('output/pdf/') and name not in ('ebook-lado-b.pdf','guia-perfil-ia.pdf'):continue
   if name=='montserrat.woff2':continue
   z.write(f,'lado-b/'+rel.as_posix())
print(target)
