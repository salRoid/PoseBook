#!/usr/bin/env node
// Individually mapped right-facing three-quarter chest anatomy.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sex = process.argv[2] === 'm' ? 'm' : 'f';
const source = join(ROOT, 'parts', 'color-assets', `chest-34--${sex}.png`);
const output = `/tmp/posebook-chest-34--${sex}-candidate.png`;

const female = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374">
 <defs><filter id="s"><feGaussianBlur stdDeviation="7"/></filter><filter id="b"><feGaussianBlur stdDeviation="15"/></filter>
 <linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efb891" stop-opacity=".13"/><stop offset="1" stop-color="#efb891" stop-opacity="0"/></linearGradient>
 <linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8b5647" stop-opacity="0"/><stop offset="1" stop-color="#8b5647" stop-opacity=".18"/></linearGradient></defs>
 <!-- neck base and visible right clavicle follow the rotated shoulder line -->
 <path d="M584 205 C650 235 714 271 778 321" fill="none" stroke="#8b5647" stroke-width="9" opacity=".10" filter="url(#s)"/>
 <ellipse cx="696" cy="310" rx="22" ry="38" fill="#e8ad87" opacity=".06" filter="url(#b)"/>
 <!-- near breast dominates; its root and lower pole turn toward the right-facing apex -->
 <path d="M630 414 C748 409 895 467 1028 575 C920 525 795 508 674 530Z" fill="url(#v)" filter="url(#s)"/>
 <path d="M674 530 C805 509 935 548 1024 606 C955 677 816 693 674 621Z" fill="url(#u)" opacity=".45" filter="url(#s)"/>
 <path d="M690 626 C780 681 890 690 985 646" fill="none" stroke="#8b5647" stroke-width="13" stroke-linecap="round" opacity=".10" filter="url(#s)"/>
 <!-- the foreshortened far breast remains distinctly visible in three-quarter view -->
 <ellipse cx="530" cy="548" rx="160" ry="135" fill="#8b5647" opacity=".055" filter="url(#b)"/>
 <path d="M350 397 C472 348 615 399 720 530 C618 470 493 472 377 570Z" fill="url(#v)" opacity=".82" filter="url(#s)"/>
 <path d="M365 540 C438 646 575 693 700 615" fill="none" stroke="#8b5647" stroke-width="13" stroke-linecap="round" opacity=".12" filter="url(#s)"/>
 <ellipse cx="510" cy="563" rx="11" ry="15" fill="#a46157" opacity=".34"/>
 <path d="M518 560 Q526 564 518 571Z" fill="#77463f" opacity=".44"/>
 <ellipse cx="1031" cy="605" rx="10" ry="15" fill="#a46157" opacity=".37"/>
 <path d="M1038 602 Q1045 606 1038 610Z" fill="#77463f" opacity=".48"/>
 <!-- rotated sternum/costal margin and foreshortened abdominal planes -->
 <path d="M671 408 C687 500 704 622 724 710" fill="none" stroke="#855244" stroke-width="8" opacity=".055" filter="url(#s)"/>
 <path d="M570 695 C630 743 688 768 744 778 M744 778 C807 775 868 749 918 704" fill="none" stroke="#885447" stroke-width="10" opacity=".09" filter="url(#s)"/>
 <path d="M740 758 C750 830 758 904 756 970" fill="none" stroke="#855244" stroke-width="8" opacity=".08" filter="url(#s)"/>
 <path d="M620 812 C671 798 711 807 742 829 M758 829 C797 811 839 808 879 819 M638 900 C681 889 718 899 748 917 M760 917 C796 900 830 898 863 908" fill="none" stroke="#8a5647" stroke-width="8" opacity=".075" filter="url(#s)"/>
 <path d="M910 748 C872 815 855 895 861 970" fill="none" stroke="#8a5647" stroke-width="11" opacity=".07" filter="url(#s)"/>
 <path d="M750 982 Q756 987 763 981" fill="none" stroke="#74473e" stroke-width="2.4" stroke-linecap="round" opacity=".38"/>
 </svg>`;

const male = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374">
 <defs><filter id="s"><feGaussianBlur stdDeviation="7"/></filter><filter id="b"><feGaussianBlur stdDeviation="15"/></filter>
 <linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d89369" stop-opacity=".14"/><stop offset="1" stop-color="#d89369" stop-opacity="0"/></linearGradient>
 <linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#704336" stop-opacity="0"/><stop offset="1" stop-color="#704336" stop-opacity=".20"/></linearGradient></defs>
 <path d="M619 205 C695 240 760 280 825 331" fill="none" stroke="#704336" stroke-width="11" opacity=".12" filter="url(#s)"/>
 <!-- near pectoral belly projects toward the right; lower edge stays above costal arch -->
 <path d="M665 348 C765 355 910 411 1040 505 C925 470 812 460 704 483Z" fill="url(#v)" filter="url(#s)"/>
 <path d="M704 483 C812 459 930 486 1035 540 C950 602 823 615 704 566Z" fill="url(#p)" opacity=".50" filter="url(#s)"/>
 <path d="M704 565 C802 608 921 613 1018 574" fill="none" stroke="#704336" stroke-width="14" stroke-linecap="round" opacity=".14" filter="url(#s)"/>
 <!-- far pec is compressed by the turn but remains visible -->
 <path d="M428 378 C520 366 614 389 704 443 C625 425 549 429 475 457Z" fill="url(#v)" opacity=".72" filter="url(#s)"/>
 <path d="M472 528 C545 567 625 575 700 554" fill="none" stroke="#704336" stroke-width="12" opacity=".10" filter="url(#s)"/>
 <ellipse cx="555" cy="526" rx="6" ry="9" fill="#72443a" opacity=".30"/>
 <path d="M560 523 Q566 527 560 531Z" fill="#55342e" opacity=".46"/>
 <path d="M690 386 C712 462 726 533 738 605" fill="none" stroke="#663e34" stroke-width="8" opacity=".075" filter="url(#s)"/>
 <ellipse cx="1026" cy="579" rx="13" ry="16" fill="#72443a" opacity=".13" filter="url(#s)"/>
 <ellipse cx="1026" cy="579" rx="7" ry="10" fill="#72443a" opacity=".30"/>
 <path d="M1032 576 Q1039 580 1032 584Z" fill="#55342e" opacity=".46"/>
 <!-- costal edge, rotated linea alba, rectus blocks and near external oblique -->
 <path d="M575 632 C646 676 715 701 780 710 M780 710 C852 703 918 674 966 628" fill="none" stroke="#704336" stroke-width="11" opacity=".12" filter="url(#s)"/>
 <path d="M770 642 C778 760 786 909 780 1020" fill="none" stroke="#663e34" stroke-width="9" opacity=".12" filter="url(#s)"/>
 <path d="M626 724 C680 711 728 720 766 743 M790 743 C836 721 883 713 927 721 M642 819 C692 808 734 818 771 839 M791 839 C833 818 875 811 913 817 M661 913 C706 904 744 915 776 933 M792 933 C829 915 866 909 900 914" fill="none" stroke="#704336" stroke-width="9" opacity=".115" filter="url(#s)"/>
 <path d="M950 687 C910 774 892 871 898 966" fill="none" stroke="#704336" stroke-width="13" opacity=".105" filter="url(#s)"/>
 <path d="M774 972 Q781 978 789 971" fill="none" stroke="#57362f" stroke-width="2.5" stroke-linecap="round" opacity=".42"/>
 </svg>`;

const rgb = await sharp(source).composite([{ input: Buffer.from(sex === 'm' ? male : female) }]).removeAlpha().png().toBuffer();
const alpha = await sharp(source).extractChannel('alpha').raw().toBuffer();
const result = await sharp(rgb).joinChannel(alpha, { raw: { width: 1145, height: 1374, channels: 1 } }).png().toBuffer();
writeFileSync(output, result);
console.log(`posebook: three-quarter chest candidate written to ${output}`);
