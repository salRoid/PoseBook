#!/usr/bin/env node
// Pelvis candidates mapped independently for front, back, side, and 3/4 views.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { default: sharp } = await import('sharp');
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const sex=process.argv[2]==='m'?'m':'f';
const view=['front','back','side','34'].includes(process.argv[3])?process.argv[3]:'front';
const file=`pelvis-${view}--${sex}.png`,source=join(ROOT,'parts','color-assets',file);
const output=`/tmp/posebook-${file.replace('.png','')}-candidate.png`,meta=await sharp(source).metadata();
const defs=`<defs><filter id="s"><feGaussianBlur stdDeviation="7"/></filter><filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs>`;
const wrap=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${defs}${body}</svg>`;

const frontF=wrap(1254,1254,`
 <path d="M620 190 Q627 196 635 189" fill="none" stroke="#75483f" stroke-width="3" stroke-linecap="round" opacity=".38"/>
 <path d="M305 382 C390 425 490 500 592 630 M949 382 C864 425 764 500 662 630" fill="none" stroke="#885447" stroke-width="11" opacity=".07" filter="url(#s)"/>
 <path d="M350 580 C440 620 530 663 602 725 M904 580 C814 620 724 663 652 725" fill="none" stroke="#885447" stroke-width="10" opacity=".065" filter="url(#s)"/>
 <!-- pubic mound and anatomically centered external vulva -->
 <path d="M555 650 C585 625 669 625 699 650 C673 704 655 748 627 790 C599 748 581 704 555 650Z" fill="#efb891" opacity=".035" filter="url(#b)"/>
 <ellipse cx="627" cy="750" rx="54" ry="72" fill="#9b5b55" opacity=".045" filter="url(#b)"/>
 <path d="M609 785 C601 800 608 820 621 834 M645 785 C653 800 646 820 633 834" fill="none" stroke="#8a504c" stroke-width="5" stroke-linecap="round" opacity=".22"/>
 <path d="M627 792 C624 807 624 824 627 835" fill="none" stroke="#70423c" stroke-width="3" stroke-linecap="round" opacity=".38"/>
`);
const frontM=wrap(1254,1254,`
 <path d="M620 175 Q627 181 635 174" fill="none" stroke="#57362f" stroke-width="3" stroke-linecap="round" opacity=".42"/>
 <path d="M305 378 C395 425 495 510 595 645 M949 378 C859 425 759 510 659 645" fill="none" stroke="#6b4035" stroke-width="12" opacity=".085" filter="url(#s)"/>
 <path d="M365 565 C465 610 545 657 603 710 M889 565 C789 610 709 657 651 710" fill="none" stroke="#6b4035" stroke-width="10" opacity=".08" filter="url(#s)"/>
 <!-- shaft follows the midline; glans and scrotal halves sit in the source's central extension -->
 <ellipse cx="601" cy="811" rx="27" ry="31" fill="#704337" opacity=".10" filter="url(#s)"/><ellipse cx="653" cy="811" rx="27" ry="31" fill="#704337" opacity=".10" filter="url(#s)"/>
 <path d="M608 760 C618 750 636 750 646 760 L642 857 C637 875 617 875 612 857Z" fill="#75483c" opacity=".095" filter="url(#s)"/>
 <path d="M612 855 Q627 871 642 855" fill="none" stroke="#57362f" stroke-width="3" stroke-linecap="round" opacity=".31"/>
 <path d="M627 787 C623 802 623 818 627 832" fill="none" stroke="#57362f" stroke-width="2.3" opacity=".18"/>
`);

const backF=wrap(1254,1254,`
 <ellipse cx="510" cy="300" rx="13" ry="8" fill="#805044" opacity=".035" filter="url(#s)"/><ellipse cx="744" cy="300" rx="13" ry="8" fill="#805044" opacity=".035" filter="url(#s)"/>
 <path d="M627 540 C592 598 578 684 590 778 M627 540 C662 598 676 684 664 778" fill="none" stroke="#855144" stroke-width="11" opacity=".07" filter="url(#s)"/>
 <!-- gluteal cleft narrows into the perineum; anus sits above the leg gap -->
 <path d="M627 455 C619 560 619 690 627 805" fill="none" stroke="#74473f" stroke-width="6" opacity=".18" filter="url(#s)"/>
 <ellipse cx="627" cy="792" rx="7" ry="5" fill="#6f433d" opacity=".31"/>
 <path d="M255 825 C350 892 460 925 560 905 M999 825 C904 892 794 925 694 905" fill="none" stroke="#855144" stroke-width="13" opacity=".09" filter="url(#s)"/>
`);
const backM=wrap(1254,1254,`
 <ellipse cx="502" cy="290" rx="14" ry="8" fill="#623b32" opacity=".04" filter="url(#s)"/><ellipse cx="752" cy="290" rx="14" ry="8" fill="#623b32" opacity=".04" filter="url(#s)"/>
 <path d="M627 485 C580 560 565 665 580 765 M627 485 C674 560 689 665 674 765" fill="none" stroke="#684036" stroke-width="13" opacity=".09" filter="url(#s)"/>
 <path d="M627 445 C620 520 620 595 627 675" fill="none" stroke="#57362f" stroke-width="5" stroke-linecap="round" opacity=".16"/>
 <ellipse cx="627" cy="668" rx="7" ry="5" fill="#51322e" opacity=".30"/>
 <path d="M220 805 C335 875 430 904 520 894 M1034 805 C919 875 824 904 734 894" fill="none" stroke="#684036" stroke-width="15" opacity=".10" filter="url(#s)"/>
`);

const sideF=wrap(1122,1402,`
 <path d="M750 250 Q758 256 766 249" fill="none" stroke="#74473e" stroke-width="2.8" stroke-linecap="round" opacity=".36"/>
 <path d="M485 360 C590 405 700 475 802 575" fill="none" stroke="#885447" stroke-width="11" opacity=".07" filter="url(#s)"/>
 <path d="M230 620 C250 745 338 845 485 900" fill="none" stroke="#885447" stroke-width="14" opacity=".085" filter="url(#s)"/>
 <path d="M280 905 C360 940 448 941 525 910" fill="none" stroke="#885447" stroke-width="11" opacity=".08" filter="url(#s)"/>
 <!-- side-visible pubic mound and labial crease remain anterior to the perineum -->
 <path d="M735 770 C758 790 765 815 755 840" fill="none" stroke="#9b5b55" stroke-width="7" opacity=".07" filter="url(#s)"/>
 <path d="M755 805 C762 817 761 831 755 842" fill="none" stroke="#75453f" stroke-width="3" stroke-linecap="round" opacity=".28"/>
 <path d="M560 830 C542 850 535 874 541 895" fill="none" stroke="#75453f" stroke-width="3" opacity=".18"/>
`);
const sideM=wrap(1122,1402,`
 <path d="M820 220 Q828 226 836 219" fill="none" stroke="#57362f" stroke-width="2.8" stroke-linecap="round" opacity=".40"/>
 <path d="M470 350 C590 400 715 490 825 600" fill="none" stroke="#6b4035" stroke-width="12" opacity=".09" filter="url(#s)"/>
 <path d="M210 610 C240 740 330 840 480 895 M275 900 C355 935 445 935 520 906" fill="none" stroke="#6b4035" stroke-width="14" opacity=".10" filter="url(#s)"/>
 <!-- penis follows the actual right-facing projection; glans crease is at its distal cap -->
 <path d="M845 700 C900 704 953 735 987 774 C942 757 899 753 857 765Z" fill="#704337" opacity=".10" filter="url(#s)"/>
 <path d="M970 760 Q988 775 970 790" fill="none" stroke="#57362f" stroke-width="3" stroke-linecap="round" opacity=".32"/>
 <ellipse cx="842" cy="808" rx="34" ry="42" fill="#704337" opacity=".09" filter="url(#s)"/>
 <path d="M842 792 C861 813 863 839 850 858" fill="none" stroke="#57362f" stroke-width="4" stroke-linecap="round" opacity=".24"/>
`);

const qF=wrap(1254,1254,`
 <!-- rear three-quarter sacrum and gluteal split curve with the rotation -->
 <path d="M670 410 C638 505 620 610 627 720" fill="none" stroke="#805044" stroke-width="9" opacity=".07" filter="url(#s)"/>
 <path d="M650 485 C620 575 615 690 632 790" fill="none" stroke="#74473f" stroke-width="6" opacity=".18" filter="url(#s)"/>
 <path d="M235 800 C335 880 470 920 598 885 M655 892 C755 912 850 885 930 840" fill="none" stroke="#855144" stroke-width="13" opacity=".085" filter="url(#s)"/>
 <path d="M760 410 C835 475 890 550 918 635" fill="none" stroke="#885447" stroke-width="10" opacity=".055" filter="url(#s)"/>
`);
const qM=wrap(1254,1254,`
 <path d="M665 400 C637 495 625 590 638 690" fill="none" stroke="#623b32" stroke-width="10" opacity=".08" filter="url(#s)"/>
 <path d="M655 470 C630 555 628 645 642 735" fill="none" stroke="#57362f" stroke-width="7" opacity=".18" filter="url(#s)"/>
 <path d="M220 800 C335 880 460 915 575 892 M705 895 C795 905 875 875 955 830" fill="none" stroke="#684036" stroke-width="14" opacity=".10" filter="url(#s)"/>
 <path d="M760 390 C850 465 920 555 955 650" fill="none" stroke="#6b4035" stroke-width="11" opacity=".07" filter="url(#s)"/>
`);

const map={front:{f:frontF,m:frontM},back:{f:backF,m:backM},side:{f:sideF,m:sideM},'34':{f:qF,m:qM}};
const svg=map[view][sex];
const rendered=sharp(source).composite([{input:Buffer.from(svg)}]);
// Flatten this source over its sampled base skin before restoring alpha. Its
// partially transparent inner-gap pixels otherwise retain colored/black matte.
let rgb=view==='back'&&sex==='m'
 ? await rendered.flatten({background:'#9a6347'}).removeAlpha().png().toBuffer()
 : await rendered.removeAlpha().png().toBuffer();
const alpha=await sharp(source).extractChannel('alpha').raw().toBuffer();
// The female rear-three-quarter source contains two accidental transparent
// cuts inside the body: a curved slit across the near glute and an overly
// high, needle-sharp start to the leg gap. Repair only those interior alpha
// tears; keep the true outer silhouette and the lower leg gap untouched.
if(view==='34'&&sex==='f') {
 const {data:rgbRaw,info}=await sharp(rgb).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const repair=(x0,y0,x1,y1)=>{
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
   const ai=y*meta.width+x;
   if(alpha[ai]>=245) continue;
   let left=x-1,right=x+1;
   while(left>=0&&alpha[y*meta.width+left]<245) left--;
   while(right<meta.width&&alpha[y*meta.width+right]<245) right++;
   if(left<0&&right>=meta.width) continue;
   const dst=ai*3;
   for(let c=0;c<3;c++) {
    if(left>=0&&right<meta.width) rgbRaw[dst+c]=Math.round((rgbRaw[(y*meta.width+left)*3+c]+rgbRaw[(y*meta.width+right)*3+c])/2);
    else rgbRaw[dst+c]=rgbRaw[(y*meta.width+(left>=0?left:right))*3+c];
   }
   alpha[ai]=255;
  }
 };
 repair(405,710,500,875);
 repair(570,895,650,965);
 // Rematte the antialiased edge where the legitimate lower leg gap begins so
 // no black source-matte pixels survive as a speckled cusp.
 for(let y=960;y<=1030;y++) for(let x=570;x<=670;x++) {
  const ai=y*meta.width+x;
  if(alpha[ai]===0||alpha[ai]===255) continue;
  let left=x-1,right=x+1;
  while(left>=0&&alpha[y*meta.width+left]<245) left--;
  while(right<meta.width&&alpha[y*meta.width+right]<245) right++;
  if(left<0&&right>=meta.width) continue;
  const srcX=left>=0?left:right,dst=ai*3,src=(y*meta.width+srcX)*3;
  for(let c=0;c<3;c++) rgbRaw[dst+c]=rgbRaw[src+c];
 }
 rgb=await sharp(rgbRaw,{raw:{width:info.width,height:info.height,channels:3}}).png().toBuffer();
}
writeFileSync(output,await sharp(rgb).joinChannel(alpha,{raw:{width:meta.width,height:meta.height,channels:1}}).png().toBuffer());
console.log(`posebook: pelvis candidate written to ${output}`);
