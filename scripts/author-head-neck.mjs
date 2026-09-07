#!/usr/bin/env node
// View-specific anatomical definition for the head and neck color cutouts.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const {default:sharp}=await import('sharp');
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const file=process.argv[2]; if(!file) throw new Error('filename required');
const source=join(ROOT,'parts','color-assets',file), meta=await sharp(source).metadata();
const output=`/tmp/posebook-${file.replace('.png','')}-candidate.png`;
const male=file.includes('--m'), ink=male?'#58352e':'#75483f', blush=male?'#8e5747':'#a96359', hi=male?'#d6946d':'#e6a885';
const defs=`<defs><filter id="s"><feGaussianBlur stdDeviation="6"/></filter><filter id="b"><feGaussianBlur stdDeviation="13"/></filter></defs>`;
const svg=(body,viewBox=`0 0 ${meta.width} ${meta.height}`)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="${viewBox}">${defs}${body}</svg>`;
let body='', viewBox;

if(file==='head-front--f.png') { viewBox='0 0 887 1774'; body=`
 <path d="M285 720 Q350 680 407 716 M480 716 Q540 680 605 720" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" opacity=".30"/>
 <path d="M295 760 Q350 792 405 758 M482 758 Q540 792 595 760" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".38"/>
 <ellipse cx="350" cy="761" rx="8" ry="10" fill="${ink}" opacity=".38"/><ellipse cx="540" cy="761" rx="8" ry="10" fill="${ink}" opacity=".38"/>
 <path d="M443 760 C430 845 426 925 444 970 M420 981 Q443 995 468 980" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".24"/>
 <path d="M365 1068 Q443 1100 522 1068 M388 1080 Q443 1118 500 1080" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".34"/>
 <ellipse cx="296" cy="900" rx="70" ry="48" fill="${blush}" opacity=".035" filter="url(#b)"/><ellipse cx="590" cy="900" rx="70" ry="48" fill="${blush}" opacity=".035" filter="url(#b)"/>
 <path d="M355 1190 Q443 1235 532 1190" fill="none" stroke="${ink}" stroke-width="10" opacity=".035" filter="url(#s)"/>`; }
else if(file==='head-front--m.png') { viewBox='0 0 887 1774'; body=`
 <path d="M245 545 Q325 505 395 544 M492 544 Q562 505 642 545" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" opacity=".33"/>
 <path d="M258 594 Q325 628 392 592 M495 592 Q562 628 629 594" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".40"/>
 <ellipse cx="326" cy="595" rx="9" ry="11" fill="${ink}" opacity=".42"/><ellipse cx="561" cy="595" rx="9" ry="11" fill="${ink}" opacity=".42"/>
 <path d="M443 590 C427 680 425 758 444 805 M414 818 Q443 835 474 818" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".27"/>
 <path d="M360 900 Q443 930 526 900 M380 913 Q443 948 506 913" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".35"/>
 <path d="M265 705 C290 825 330 930 385 1010 M622 705 C597 825 557 930 502 1010" fill="none" stroke="${ink}" stroke-width="16" opacity=".035" filter="url(#s)"/>`; }
else if(/^head-back--/.test(file)) { viewBox='0 0 887 1774'; body=`
 <path d="M${male?118:142} ${male?735:770} Q${male?165:190} ${male?790:830} ${male?140:164} ${male?865:900} M${male?769:745} ${male?735:770} Q${male?722:697} ${male?790:830} ${male?747:723} ${male?865:900}" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".28"/>
 <path d="M330 980 C365 1040 405 1070 443 1075 C482 1070 522 1040 557 980" fill="none" stroke="${ink}" stroke-width="14" opacity=".05" filter="url(#s)"/>
 <path d="M355 1120 C378 1225 385 1330 372 1440 M532 1120 C509 1225 502 1330 515 1440" fill="none" stroke="${ink}" stroke-width="10" opacity=".12" filter="url(#s)"/>
 <path d="M372 1440 Q443 1480 515 1440" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" opacity=".15"/>`; }
else if(file==='head-side--f.png') { viewBox='0 0 1024 1536'; body=`
 <path d="M725 530 Q778 505 822 532" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" opacity=".31"/>
 <path d="M742 568 Q785 588 822 563" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".39"/><ellipse cx="789" cy="566" rx="8" ry="10" fill="${ink}" opacity=".40"/>
 <path d="M846 568 C875 620 891 663 890 703 Q915 715 935 700" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".25"/>
 <path d="M884 769 Q925 784 955 767 M891 783 Q925 804 951 784" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".34"/>
 <path d="M434 585 C382 620 385 720 445 755 C485 730 500 682 480 635 M425 640 Q458 663 439 700" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".25"/>
 <path d="M650 895 C735 930 820 925 885 890" fill="none" stroke="${ink}" stroke-width="12" opacity=".04" filter="url(#s)"/>`; }
// The side-head asset is a clean profile cutout; facial marks belong to the
// face layer, not the anatomical colour layer.
else if(file==='head-side--m.png') { viewBox='0 0 887 1774'; body=''; }
else if(file==='head-34--f.png') { viewBox='0 0 887 1774'; body=`
 <path d="M435 585 Q490 560 535 586 M615 565 Q670 540 716 570" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" opacity=".30"/>
 <path d="M447 625 Q490 648 530 623 M625 606 Q668 630 708 604" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".39"/>
 <ellipse cx="492" cy="625" rx="7" ry="9" fill="${ink}" opacity=".38"/><ellipse cx="670" cy="607" rx="8" ry="10" fill="${ink}" opacity=".40"/>
 <path d="M665 618 C690 682 706 733 716 770 M690 780 Q725 794 748 774" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".25"/>
 <path d="M628 855 Q700 880 765 848 M644 869 Q705 900 755 866" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".34"/>
 <path d="M388 710 C370 810 410 900 480 960" fill="none" stroke="${ink}" stroke-width="13" opacity=".04" filter="url(#s)"/>`; }
else if(file==='head-34--m.png') { viewBox='0 0 1024 1536'; body=`
 <path d="M505 490 Q565 460 615 490 M700 475 Q760 448 812 482" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" opacity=".32"/>
 <path d="M520 535 Q566 560 610 532 M715 520 Q760 546 805 516" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".41"/>
 <ellipse cx="566" cy="535" rx="8" ry="10" fill="${ink}" opacity=".41"/><ellipse cx="762" cy="520" rx="9" ry="11" fill="${ink}" opacity=".43"/>
 <path d="M753 532 C780 590 800 635 810 675 M785 687 Q822 702 850 682" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".27"/>
 <path d="M705 760 Q790 790 862 755 M725 777 Q792 808 850 774" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".35"/>
 <path d="M450 635 C430 745 475 840 555 900" fill="none" stroke="${ink}" stroke-width="14" opacity=".045" filter="url(#s)"/>`; }
else if(/^neck-front--/.test(file)) { viewBox='0 0 1086 1448'; body=`
 <path d="M${male?400:410} 470 C${male?425:435} 620 ${male?460:470} 780 500 955 M${male?686:676} 470 C${male?661:651} 620 ${male?626:616} 780 586 955" fill="none" stroke="${ink}" stroke-width="11" opacity="${male?'.14':'.10'}" filter="url(#s)"/>
 <path d="M535 735 Q543 ${male?754:748} 551 735" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity="${male?'.22':'.16'}"/>
 <path d="M285 1115 C370 1085 440 1095 500 1135 M801 1115 C716 1085 646 1095 586 1135" fill="none" stroke="${ink}" stroke-width="11" opacity="${male?'.13':'.09'}" filter="url(#s)"/>
 <path d="M500 1080 Q543 1105 586 1080" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" opacity=".19"/>`; }
else if(/^neck-side--/.test(file)) { viewBox='0 0 1086 1448'; body=`
 <path d="M${male?430:455} 430 C${male?500:515} 570 ${male?560:570} 720 ${male?620:625} 910" fill="none" stroke="${ink}" stroke-width="${male?5:4.5}" stroke-linecap="round" opacity="${male?'.18':'.14'}"/>
 <path d="M${male?670:680} 520 C${male?645:655} 650 ${male?640:650} 780 ${male?665:675} 895" fill="none" stroke="${ink}" stroke-width="${male?4:3.5}" stroke-linecap="round" opacity="${male?'.14':'.11'}"/>
 <path d="M${male?708:716} 744 Q${male?719:727} 748 ${male?727:735} 742" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" opacity="${male?'.19':'.14'}"/>`; }
else throw new Error(`unsupported ${file}`);

const overlay=svg(body,viewBox);
let rgb=await sharp(source).composite([{input:Buffer.from(overlay)}]).removeAlpha().png().toBuffer();
if(file==='neck-side--m.png') {
 const clear=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="76" height="220"><rect width="76" height="220" fill="#000"/></svg>');
 rgb=await sharp(rgb).composite([{input:clear,left:1010,top:760}]).png().toBuffer();
}
const alpha=await sharp(source).extractChannel('alpha').raw().toBuffer();
// Remove the detached alpha island in the male profile source. It is outside
// the head/neck silhouette and cannot represent anatomy.
if(file==='neck-side--m.png') {
 for(let y=760;y<980;y++) for(let x=1010;x<meta.width;x++) alpha[y*meta.width+x]=0;
}
writeFileSync(output,await sharp(rgb).joinChannel(alpha,{raw:{width:meta.width,height:meta.height,channels:1}}).png().toBuffer());
console.log(`posebook: head/neck candidate written to ${output}`);
