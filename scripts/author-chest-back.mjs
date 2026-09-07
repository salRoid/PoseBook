#!/usr/bin/env node
// Individually mapped posterior torso anatomy; candidates remain temporary.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sex = process.argv[2] === 'm' ? 'm' : 'f';
const source = join(ROOT, 'parts', 'color-assets', `chest-back--${sex}.png`);
const output = `/tmp/posebook-chest-back--${sex}-candidate.png`;

const commonTop = `<defs><filter id="s"><feGaussianBlur stdDeviation="8"/></filter><filter id="b"><feGaussianBlur stdDeviation="15"/></filter></defs>`;
const female = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374">${commonTop}
 <!-- trapezius planes descend from the neck and soften into the shoulder girdle -->
 <path d="M500 170 C485 265 430 330 340 376 M645 170 C660 265 715 330 805 376" fill="none" stroke="#875344" stroke-width="13" opacity=".075" filter="url(#s)"/>
 <path d="M572 230 C540 304 505 353 462 390 M572 230 C604 304 639 353 682 390" fill="none" stroke="#e3a681" stroke-width="18" opacity=".055" filter="url(#b)"/>
 <!-- scapular borders and lower tips follow the rib cage, not vertical templates -->
 <path d="M350 390 C392 425 414 493 405 574 C397 619 420 650 465 668" fill="none" stroke="#865244" stroke-width="11" opacity=".085" filter="url(#s)"/>
 <path d="M795 390 C753 425 731 493 740 574 C748 619 725 650 680 668" fill="none" stroke="#865244" stroke-width="11" opacity=".085" filter="url(#s)"/>
 <path d="M305 565 C355 632 417 680 486 704 M840 565 C790 632 728 680 659 704" fill="none" stroke="#875344" stroke-width="14" opacity=".06" filter="url(#s)"/>
 <!-- spinal furrow, lumbar erectors and sacral taper -->
 <path d="M572 315 C566 520 568 790 572 1055" fill="none" stroke="#7e4e42" stroke-width="10" opacity=".075" filter="url(#s)"/>
 <path d="M520 725 C495 820 505 950 548 1058 M625 725 C650 820 640 950 597 1058" fill="none" stroke="#e0a27e" stroke-width="23" opacity=".045" filter="url(#b)"/>
 <path d="M535 1040 C550 1060 564 1072 572 1080 C580 1072 595 1060 610 1040" fill="none" stroke="#855144" stroke-width="8" opacity=".07" filter="url(#s)"/>
 </svg>`;
const male = `<svg xmlns="http://www.w3.org/2000/svg" width="1145" height="1374">${commonTop}
 <!-- broad trapezius diamond and rear shoulder transition -->
 <path d="M490 150 C470 255 405 330 295 385 M655 150 C675 255 740 330 850 385" fill="none" stroke="#684036" stroke-width="17" opacity=".11" filter="url(#s)"/>
 <path d="M572 230 C520 330 486 405 475 510 M572 230 C624 330 658 405 670 510" fill="none" stroke="#d28e68" stroke-width="25" opacity=".065" filter="url(#b)"/>
 <!-- scapulae: curved medial borders and inferior angles -->
 <path d="M320 390 C382 425 420 500 412 585 C407 630 438 668 495 695" fill="none" stroke="#694036" stroke-width="15" opacity=".12" filter="url(#s)"/>
 <path d="M825 390 C763 425 725 500 733 585 C738 630 707 668 650 695" fill="none" stroke="#694036" stroke-width="15" opacity=".12" filter="url(#s)"/>
 <!-- latissimus sweeps from axilla toward the lumbar fascia -->
 <path d="M235 555 C310 640 405 704 510 750 M910 555 C835 640 740 704 635 750" fill="none" stroke="#684036" stroke-width="21" opacity=".095" filter="url(#s)"/>
 <path d="M285 665 C360 740 420 810 475 900 M860 665 C785 740 725 810 670 900" fill="none" stroke="#d28e68" stroke-width="35" opacity=".045" filter="url(#b)"/>
 <!-- spinal furrow, paired erectors and sacral triangle -->
 <path d="M572 300 C565 515 567 825 572 1065" fill="none" stroke="#603a32" stroke-width="13" opacity=".12" filter="url(#s)"/>
 <path d="M505 735 C480 835 493 965 548 1072 M640 735 C665 835 652 965 597 1072" fill="none" stroke="#d7926c" stroke-width="30" opacity=".055" filter="url(#b)"/>
 <path d="M523 1035 C542 1064 559 1080 572 1091 C585 1080 603 1064 622 1035" fill="none" stroke="#684036" stroke-width="10" opacity=".105" filter="url(#s)"/>
 </svg>`;

const rgb = await sharp(source).composite([{ input: Buffer.from(sex === 'm' ? male : female) }]).removeAlpha().png().toBuffer();
const alpha = await sharp(source).extractChannel('alpha').raw().toBuffer();
const result = await sharp(rgb).joinChannel(alpha, { raw: { width: 1145, height: 1374, channels: 1 } }).png().toBuffer();
writeFileSync(output, result);
console.log(`posebook: back chest candidate written to ${output}`);
