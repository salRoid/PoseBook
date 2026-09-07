#!/usr/bin/env node
// Individually mapped front-view chest anatomy. Candidates stay in /tmp until
// the independent anatomical review passes them.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sex = process.argv[2] === 'm' ? 'm' : 'f';
const source = join(ROOT, 'parts', 'color-assets', `chest-front--${sex}.png`);
const output = `/tmp/posebook-chest-front--${sex}-candidate.png`;

const female = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374" viewBox="0 0 1145 1374">
 <defs><filter id="s"><feGaussianBlur stdDeviation="9"/></filter><filter id="b"><feGaussianBlur stdDeviation="18"/></filter>
 <radialGradient id="bh"><stop stop-color="#efb891" stop-opacity=".12"/><stop offset="1" stop-color="#efb891" stop-opacity="0"/></radialGradient></defs>
 <!-- collarbones and the shallow suprasternal hollow -->
 <path d="M566 235 C500 250 445 278 390 311" fill="none" stroke="#8e5948" stroke-width="8" opacity=".10" filter="url(#s)"/>
 <path d="M579 235 C645 250 700 278 755 311" fill="none" stroke="#8e5948" stroke-width="8" opacity=".10" filter="url(#s)"/>
 <ellipse cx="572" cy="254" rx="18" ry="25" fill="#865344" opacity=".07" filter="url(#s)"/>
 <!-- paired breast volumes: roots below the clavicles, weight carried low -->
 <ellipse cx="410" cy="565" rx="170" ry="175" fill="url(#bh)" filter="url(#b)"/>
 <ellipse cx="735" cy="565" rx="170" ry="175" fill="url(#bh)" filter="url(#b)"/>
 <path d="M290 630 C352 688 447 698 548 644" fill="none" stroke="#8d5748" stroke-width="15" stroke-linecap="round" opacity=".10" filter="url(#s)"/>
 <path d="M597 644 C698 698 793 688 855 630" fill="none" stroke="#8d5748" stroke-width="15" stroke-linecap="round" opacity=".10" filter="url(#s)"/>
 <!-- areolae lie on the lower-front breast apex, not high on the chest -->
 <ellipse cx="395" cy="608" rx="21" ry="17" fill="#a86459" opacity=".34" filter="url(#s)"/>
 <ellipse cx="750" cy="608" rx="21" ry="17" fill="#a86459" opacity=".34" filter="url(#s)"/>
 <ellipse cx="395" cy="608" rx="14" ry="11" fill="#a05c53" opacity=".30"/>
 <ellipse cx="750" cy="608" rx="14" ry="11" fill="#a05c53" opacity=".30"/>
 <circle cx="395" cy="609" r="4" fill="#77463f" opacity=".44"/><circle cx="750" cy="609" r="4" fill="#77463f" opacity=".44"/>
 <!-- sternum, costal margin, linea alba and restrained abdominal planes -->
 <path d="M572 402 C566 520 567 655 572 740" fill="none" stroke="#865344" stroke-width="7" opacity=".055" filter="url(#s)"/>
 <path d="M338 720 C415 760 488 774 548 779 M807 720 C730 760 657 774 597 779" fill="none" stroke="#895547" stroke-width="10" opacity=".07" filter="url(#s)"/>
 <path d="M572 758 C567 820 568 898 572 965" fill="none" stroke="#885447" stroke-width="8" opacity=".07" filter="url(#s)"/>
 <path d="M430 825 C470 805 516 805 550 824 M595 824 C629 805 675 805 715 825 M444 914 C480 895 519 895 551 912 M594 912 C626 895 665 895 701 914" fill="none" stroke="#8b5748" stroke-width="8" opacity=".055" filter="url(#s)"/>
 <ellipse cx="572" cy="974" rx="13" ry="8" fill="#815044" opacity=".08" filter="url(#s)"/>
 <path d="M566 974 Q572 979 579 973" fill="none" stroke="#75483f" stroke-width="2.4" stroke-linecap="round" opacity=".38"/>
 </svg>`;

const male = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374" viewBox="0 0 1145 1374">
 <defs><filter id="s"><feGaussianBlur stdDeviation="8"/></filter><filter id="b"><feGaussianBlur stdDeviation="16"/></filter>
 <radialGradient id="ph"><stop stop-color="#d9966b" stop-opacity=".14"/><stop offset="1" stop-color="#d9966b" stop-opacity="0"/></radialGradient></defs>
 <path d="M564 230 C490 251 431 280 365 320 M581 230 C655 251 714 280 780 320" fill="none" stroke="#714336" stroke-width="9" opacity=".12" filter="url(#s)"/>
 <ellipse cx="572" cy="253" rx="20" ry="27" fill="#683e33" opacity=".08" filter="url(#s)"/>
 <!-- pectoral bellies sit on the upper rib cage and end above the abdomen -->
 <ellipse cx="393" cy="495" rx="225" ry="150" fill="url(#ph)" filter="url(#b)"/>
 <ellipse cx="752" cy="495" rx="225" ry="150" fill="url(#ph)" filter="url(#b)"/>
 <path d="M190 559 C285 625 434 641 553 580 M592 580 C711 641 860 625 955 559" fill="none" stroke="#714336" stroke-width="18" stroke-linecap="round" opacity=".14" filter="url(#s)"/>
 <path d="M572 350 C564 435 565 524 572 602" fill="none" stroke="#694036" stroke-width="8" opacity=".09" filter="url(#s)"/>
 <ellipse cx="374" cy="550" rx="14" ry="11" fill="#75463c" opacity=".36"/><ellipse cx="771" cy="550" rx="14" ry="11" fill="#75463c" opacity=".36"/>
 <circle cx="374" cy="550" r="4" fill="#56342f" opacity=".48"/><circle cx="771" cy="550" r="4" fill="#56342f" opacity=".48"/>
 <!-- costal arch, linea alba, paired rectus blocks and external obliques -->
 <path d="M305 648 C385 680 470 699 548 708 M840 648 C760 680 675 699 597 708" fill="none" stroke="#714336" stroke-width="11" opacity=".09" filter="url(#s)"/>
 <path d="M572 656 C566 760 566 910 572 1031" fill="none" stroke="#694036" stroke-width="9" opacity=".10" filter="url(#s)"/>
 <path d="M420 742 C463 720 512 721 550 742 M595 742 C633 721 682 720 725 742 M430 835 C470 815 515 815 551 834 M594 834 C630 815 675 815 715 835 M445 929 C483 911 520 912 552 929 M593 929 C625 912 662 911 700 929" fill="none" stroke="#714336" stroke-width="10" opacity=".095" filter="url(#s)"/>
 <path d="M309 712 C350 789 371 880 363 968 M836 712 C795 789 774 880 782 968" fill="none" stroke="#714336" stroke-width="13" opacity=".075" filter="url(#s)"/>
 <ellipse cx="572" cy="974" rx="14" ry="9" fill="#684036" opacity=".09" filter="url(#s)"/>
 <path d="M565 974 Q572 980 580 973" fill="none" stroke="#58362f" stroke-width="2.5" stroke-linecap="round" opacity=".42"/>
 </svg>`;

const overlay = Buffer.from(sex === 'm' ? male : female);
const rgb = await sharp(source).composite([{ input: overlay }]).removeAlpha().png().toBuffer();
const alpha = await sharp(source).extractChannel('alpha').raw().toBuffer();
const result = await sharp(rgb).joinChannel(alpha, { raw: { width: 1145, height: 1374, channels: 1 } }).png().toBuffer();
writeFileSync(output, result);
console.log(`posebook: front chest candidate written to ${output}`);
