#!/usr/bin/env node
// Individually oriented limb, hand, and foot anatomy candidates.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const {default:sharp}=await import('sharp');
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const file=process.argv[2]; if(!file) throw new Error('filename required');
const source=join(ROOT,'parts','color-assets',file),meta=await sharp(source).metadata();
const output=`/tmp/posebook-${file.replace('.png','')}-candidate.png`;
const male=file.includes('--m'), dark=male?'#643c32':'#865244', light=male?'#d28e68':'#e4a681';
const defs=`<defs><filter id="s"><feGaussianBlur stdDeviation="7"/></filter><filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs>`;
const wrap=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}">${defs}${body}</svg>`;
let body='';
if(/^upper-arm--/.test(file)) body=`
 <!-- biceps/triceps separation and elbow transition, kept well inside the cutout -->
 <path d="M300 390 C340 470 350 575 340 700 M500 390 C465 480 450 590 460 700" fill="none" stroke="${dark}" stroke-width="11" opacity="${male?'.11':'.075'}" filter="url(#s)"/>
 <path d="M350 310 C420 390 442 520 420 680" fill="none" stroke="${light}" stroke-width="26" opacity=".045" filter="url(#b)"/>
 <path d="M340 805 C370 823 408 825 435 808" fill="none" stroke="${dark}" stroke-width="7" opacity="${male?'.10':'.07'}"/>
 <!-- forearm flexor/extensor masses taper toward the wrist -->
 <path d="M292 915 C355 1010 380 1180 354 1430 M470 900 C430 1050 421 1220 438 1435" fill="none" stroke="${dark}" stroke-width="11" opacity="${male?'.09':'.06'}" filter="url(#s)"/>
 <path d="M365 930 C395 1085 398 1270 390 1450" fill="none" stroke="${light}" stroke-width="18" opacity=".04" filter="url(#b)"/>
 <path d="M335 1515 C365 1530 408 1530 435 1515" fill="none" stroke="${dark}" stroke-width="7" opacity=".06" filter="url(#s)"/>
`;
else if(file==='upper-arm-fore--m.png') body=`
 <!-- flexed arm: internal biceps belly and returning forearm planes only -->
 <path d="M700 300 C760 335 820 350 865 335" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round" opacity=".10"/>
 <path d="M705 405 C735 465 738 525 715 580" fill="none" stroke="${light}" stroke-width="15" stroke-linecap="round" opacity=".04"/>
`;
else if(/^forearm-hand--/.test(file)) {
 const sx=meta.width/768,sy=meta.height/2048;
 body=`<g transform="scale(${sx} ${sy})">
 <path d="M370 250 C392 410 395 575 382 790" fill="none" stroke="${dark}" stroke-width="9" opacity="${male?'.10':'.07'}" filter="url(#s)"/>
 <path d="M365 760 C385 920 385 1090 375 1270" fill="none" stroke="${dark}" stroke-width="8" opacity="${male?'.09':'.06'}" filter="url(#s)"/>
 </g>`;
} else if(/^thigh--/.test(file)) {
 const sx=meta.width/887,sy=meta.height/1774;
 body=`<g transform="scale(${sx} ${sy})">
 <!-- lateral thigh: gluteal fold, quadriceps sweep, hamstring and IT band -->
 <path d="M265 330 C355 375 470 382 565 338" fill="none" stroke="${dark}" stroke-width="12" opacity="${male?'.10':'.075'}" filter="url(#s)"/>
 <path d="M550 380 C595 525 585 710 540 900" fill="none" stroke="${dark}" stroke-width="11" opacity="${male?'.11':'.075'}" filter="url(#s)"/>
 <path d="M350 420 C400 610 412 820 390 1030" fill="none" stroke="${dark}" stroke-width="11" opacity="${male?'.09':'.06'}" filter="url(#s)"/>
 <path d="M525 370 C540 590 520 835 485 1080" fill="none" stroke="${light}" stroke-width="25" opacity=".04" filter="url(#b)"/>
 <path d="M405 1110 C450 1142 500 1145 540 1118" fill="none" stroke="${dark}" stroke-width="9" opacity="${male?'.10':'.07'}"/>
 <!-- patellar transition remains centered safely inside the cutout -->
 <path d="M430 1240 C460 1225 495 1225 520 1240 M475 1280 C472 1320 473 1350 478 1380" fill="none" stroke="${dark}" stroke-width="7" opacity=".06"/>
 </g>`;
} else if(/^shin--/.test(file)) body=`
 <!-- front/three-quarter lower leg: tibial crest, tibialis anterior and calf bellies -->
 <path d="M384 250 C374 520 377 900 385 1325" fill="none" stroke="${light}" stroke-width="18" opacity=".045" filter="url(#b)"/>
 <path d="M330 330 C275 520 285 760 342 970 M438 335 C505 520 500 750 442 965" fill="none" stroke="${dark}" stroke-width="13" opacity="${male?'.11':'.075'}" filter="url(#s)"/>
 <path d="M305 520 C340 610 350 760 330 900 M465 510 C430 620 422 770 448 900" fill="none" stroke="${light}" stroke-width="22" opacity=".035" filter="url(#b)"/>
 <path d="M350 1030 C375 1160 380 1320 370 1490 M420 1020 C397 1180 395 1330 405 1490" fill="none" stroke="${dark}" stroke-width="9" opacity="${male?'.08':'.055'}" filter="url(#s)"/>
 <path d="M330 1565 C365 1580 410 1580 440 1564" fill="none" stroke="${dark}" stroke-width="7" opacity=".07" filter="url(#s)"/>
`;
else if(/^foot-front--/.test(file)) {
 const sx=meta.width/1254,sy=meta.height/1254;
 body=`<g transform="scale(${sx} ${sy})">
 <!-- ankle bones, extensor tendons and metatarsal fan -->
 <path d="M610 320 C595 470 575 620 540 780 M650 320 C665 470 690 620 740 770 M630 350 C630 520 630 690 635 835" fill="none" stroke="${dark}" stroke-width="9" opacity="${male?'.09':'.06'}" filter="url(#s)"/>
 <!-- Toe silhouettes already encode the joints; keep this view free of marks
      that could bridge the transparent interdigital gaps. -->
 </g>`;
} else if(/^foot-side--/.test(file)) {
 const sx=meta.width/1774,sy=meta.height/887;
 body=`<g transform="scale(${sx} ${sy})">
 <!-- Achilles insertion, malleolus, heel pad and longitudinal arch -->
 <path d="M320 150 C350 260 350 380 330 500" fill="none" stroke="${dark}" stroke-width="11" opacity=".08" filter="url(#s)"/>
 <ellipse cx="455" cy="520" rx="30" ry="24" fill="${dark}" opacity=".055" filter="url(#s)"/>
 <path d="M280 610 C430 685 620 680 790 615" fill="none" stroke="${dark}" stroke-width="13" opacity="${male?'.10':'.07'}" filter="url(#s)"/>
 <path d="M690 600 C850 525 1025 545 1180 650" fill="none" stroke="${light}" stroke-width="24" opacity=".035" filter="url(#b)"/>
 <!-- metatarsal line and toe joint/nail creases -->
 <path d="M760 470 C930 500 1080 570 1240 650" fill="none" stroke="${dark}" stroke-width="9" opacity=".065" filter="url(#s)"/>
 <path d="M1210 665 Q1270 690 1320 670 M1325 680 Q1375 700 1420 684 M1430 690 Q1470 707 1505 694 M1510 700 Q1535 709 1552 703" fill="none" stroke="${dark}" stroke-width="6" opacity=".09"/>
 <path d="M1260 720 Q1300 730 1330 718 M1370 725 Q1400 734 1428 724 M1470 728 Q1496 736 1515 727 M1525 730 Q1540 735 1553 730" fill="none" stroke="${dark}" stroke-width="5" opacity=".07"/>
 </g>`;
}
if(!body)throw new Error(`unsupported ${file}`);
let rgb=await sharp(source).composite([{input:Buffer.from(wrap(body))}]).removeAlpha().png().toBuffer();
const alpha=await sharp(source).extractChannel('alpha').raw().toBuffer();
if(file==='upper-arm-fore--m.png') {
 // Remove only disconnected alpha specks, retaining the single connected arm
 // silhouette and its smooth inner-elbow boundary.
 const seen=new Uint8Array(alpha.length), detached=[];
 for(let start=0;start<alpha.length;start++) {
  if(!alpha[start]||seen[start]) continue;
  const queue=[start], component=[]; seen[start]=1;
  for(let qi=0;qi<queue.length;qi++) {
   const p=queue[qi],x=p%meta.width,y=(p/meta.width)|0; component.push(p);
   const neighbors=[];
   if(x)neighbors.push(p-1); if(x<meta.width-1)neighbors.push(p+1);
   if(y)neighbors.push(p-meta.width); if(y<meta.height-1)neighbors.push(p+meta.width);
   for(const n of neighbors) if(alpha[n]&&!seen[n]) { seen[n]=1; queue.push(n); }
  }
  if(component.length<100) detached.push(...component);
 }
 const rawRgb=await sharp(rgb).raw().toBuffer();
 for(const p of detached) { alpha[p]=0; rawRgb[p*3]=0; rawRgb[p*3+1]=0; rawRgb[p*3+2]=0; }
 rgb=await sharp(rawRgb,{raw:{width:meta.width,height:meta.height,channels:3}}).png().toBuffer();
}
writeFileSync(output,await sharp(rgb).joinChannel(alpha,{raw:{width:meta.width,height:meta.height,channels:1}}).png().toBuffer());
console.log(`posebook: limb candidate written to ${output}`);
