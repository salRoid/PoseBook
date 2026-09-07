import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
const OUT='/private/tmp/claude-501/-Users-salroid-Desktop-Code-Productivity-Lumen/d3e93aa0-531a-4746-8f71-ee5b264bb6a9/scratchpad/rev';
const [,,name,...slugs]=process.argv;
const CELL=200;
const rows=[];
for(const spec of slugs){
  const [slug,sex]=spec.split('--');
  const dir=`frames/corpus/${slug}/${sex}`;
  if(!existsSync(dir)){console.log('missing',spec);continue;}
  const fs=readdirSync(dir).filter(f=>/^frame-\d+\.svg$/.test(f)).sort();
  const cells=[];
  for(const f of fs){
    const svg=readFileSync(`${dir}/${f}`,'utf8');
    const m=svg.match(/href="data:image\/png;base64,([^"]+)"/);
    if(!m){console.log('no png',spec,f);continue;}
    const buf=Buffer.from(m[1],'base64');
    // alpha -> black ink on white
    const img=sharp(buf).resize(CELL,CELL,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
    const {data,info}=await img.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const px=Buffer.alloc(info.width*info.height*3);
    for(let i=0;i<info.width*info.height;i++){const a=data[i*4+3];const v=255-a;px[i*3]=v;px[i*3+1]=v;px[i*3+2]=v;}
    cells.push(await sharp(px,{raw:{width:info.width,height:info.height,channels:3}}).png().toBuffer());
  }
  rows.push({spec,cells});
}
const maxc=Math.max(...rows.map(r=>r.cells.length));
const W=maxc*CELL, H=rows.length*CELL;
const comp=[];
rows.forEach((r,ri)=>r.cells.forEach((b,ci)=>comp.push({input:b,left:ci*CELL,top:ri*CELL})));
await sharp({create:{width:W,height:H,channels:3,background:{r:255,g:255,b:255}}}).composite(comp).png().toFile(`${OUT}/${name}.png`);
console.log(`${OUT}/${name}.png`, rows.map(r=>r.spec+':'+r.cells.length).join(' | '));
