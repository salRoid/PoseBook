#!/usr/bin/env node
// Full-torso candidates, mapped independently for front and right-facing side.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sex = process.argv[2] === 'm' ? 'm' : 'f';
const view = process.argv[3] === 'side' ? 'side' : 'front';
const file = `torso-${view}--${sex}.png`;
const source = join(ROOT, 'parts', 'color-assets', file);
const output = `/tmp/posebook-${file.replace('.png','')}-candidate.png`;
const meta = await sharp(source).metadata();
const defs = `<defs><filter id="s"><feGaussianBlur stdDeviation="7"/></filter><filter id="b"><feGaussianBlur stdDeviation="15"/></filter></defs>`;

const frontF = `<svg xmlns="http://www.w3.org/2000/svg" width="992" height="1586">${defs}
 <path d="M490 210 C430 228 375 260 322 302 M502 210 C562 228 617 260 670 302" fill="none" stroke="#8b5647" stroke-width="8" opacity=".09" filter="url(#s)"/>
 <!-- breasts sit below the shoulder girdle; lower poles carry the weight -->
 <path d="M245 365 C320 345 410 372 482 432 C405 404 330 414 265 455Z" fill="#efb891" opacity=".075" filter="url(#s)"/>
 <path d="M747 365 C672 345 582 372 510 432 C587 404 662 414 727 455Z" fill="#efb891" opacity=".075" filter="url(#s)"/>
 <path d="M250 505 C315 562 411 568 485 516 M507 516 C581 568 677 562 742 505" fill="none" stroke="#8b5647" stroke-width="13" opacity=".09" filter="url(#s)"/>
 <ellipse cx="345" cy="486" rx="18" ry="14" fill="#a46157" opacity=".30"/><ellipse cx="647" cy="486" rx="18" ry="14" fill="#a46157" opacity=".30"/>
 <circle cx="345" cy="487" r="4" fill="#75453d" opacity=".42"/><circle cx="647" cy="487" r="4" fill="#75453d" opacity=".42"/>
 <!-- rib margin, linea alba and restrained rectus planes -->
 <path d="M286 604 C360 642 426 653 480 658 M706 604 C632 642 566 653 512 658" fill="none" stroke="#885447" stroke-width="9" opacity=".07" filter="url(#s)"/>
 <path d="M496 586 C491 690 492 822 496 920" fill="none" stroke="#855244" stroke-width="7" opacity=".07" filter="url(#s)"/>
 <path d="M370 704 C410 687 454 689 482 708 M510 708 C538 689 582 687 622 704 M383 793 C421 778 458 780 485 796 M507 796 C534 780 571 778 609 793" fill="none" stroke="#8a5647" stroke-width="8" opacity=".06" filter="url(#s)"/>
 <path d="M490 890 Q496 896 503 889" fill="none" stroke="#74473e" stroke-width="2.5" stroke-linecap="round" opacity=".40"/>
 <!-- iliac crests, inguinal folds and centered external vulvar cleft -->
 <path d="M292 1000 C357 1018 423 1050 475 1110 M700 1000 C635 1018 569 1050 517 1110" fill="none" stroke="#885447" stroke-width="10" opacity=".07" filter="url(#s)"/>
 <path d="M420 1120 C452 1155 476 1192 496 1235 C516 1192 540 1155 572 1120" fill="none" stroke="#8a5647" stroke-width="8" opacity=".055" filter="url(#s)"/>
 <path d="M465 1238 C478 1227 514 1227 527 1238 C516 1260 507 1277 496 1289 C485 1277 476 1260 465 1238Z" fill="#9b5b55" opacity=".09" filter="url(#s)"/>
 <path d="M483 1250 C477 1263 481 1278 491 1287 M509 1250 C515 1263 511 1278 501 1287" fill="none" stroke="#8a504c" stroke-width="3.5" stroke-linecap="round" opacity=".23"/>
 <path d="M496 1255 C493 1267 493 1280 496 1288" fill="none" stroke="#75453f" stroke-width="2.8" stroke-linecap="round" opacity=".38"/>
 </svg>`;

const frontM = `<svg xmlns="http://www.w3.org/2000/svg" width="992" height="1586">${defs}
 <path d="M490 205 C420 227 350 265 292 310 M502 205 C572 227 642 265 700 310" fill="none" stroke="#6b4035" stroke-width="9" opacity=".11" filter="url(#s)"/>
 <!-- paired pectoral fans with a clear lower edge -->
 <path d="M205 350 C315 330 415 352 485 405 C395 384 305 395 225 435Z" fill="#d89369" opacity=".075" filter="url(#s)"/>
 <path d="M787 350 C677 330 577 352 507 405 C597 384 687 395 767 435Z" fill="#d89369" opacity=".075" filter="url(#s)"/>
 <path d="M208 500 C305 548 405 549 486 505 M506 505 C587 549 687 548 784 500" fill="none" stroke="#6b4035" stroke-width="14" opacity=".12" filter="url(#s)"/>
 <ellipse cx="333" cy="480" rx="11" ry="8" fill="#72443a" opacity=".30"/><ellipse cx="659" cy="480" rx="11" ry="8" fill="#72443a" opacity=".30"/>
 <circle cx="333" cy="480" r="3.5" fill="#55342e" opacity=".45"/><circle cx="659" cy="480" r="3.5" fill="#55342e" opacity=".45"/>
 <path d="M260 588 C338 622 416 640 482 645 M732 588 C654 622 576 640 510 645" fill="none" stroke="#6b4035" stroke-width="10" opacity=".10" filter="url(#s)"/>
 <path d="M496 565 C490 700 491 900 496 1015" fill="none" stroke="#623b32" stroke-width="8" opacity=".11" filter="url(#s)"/>
 <path d="M350 687 C398 667 448 670 482 690 M510 690 C544 670 594 667 642 687 M361 786 C406 768 450 770 485 789 M507 789 C542 770 586 768 631 786 M378 884 C419 868 455 870 487 888 M505 888 C537 870 573 868 614 884" fill="none" stroke="#6b4035" stroke-width="9" opacity=".10" filter="url(#s)"/>
 <path d="M490 925 Q496 931 503 924" fill="none" stroke="#57362f" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>
 <path d="M282 1010 C350 1032 415 1070 475 1130 M710 1010 C642 1032 577 1070 517 1130" fill="none" stroke="#6b4035" stroke-width="11" opacity=".09" filter="url(#s)"/>
 <!-- front-view penis and paired scrotal volume remain centered above the leg gap -->
 <path d="M484 1228 C491 1220 501 1220 508 1228 L506 1265 C502 1274 490 1274 486 1265Z" fill="#75483c" opacity=".12" filter="url(#s)"/>
 <path d="M485 1260 Q496 1272 507 1260" fill="none" stroke="#57362f" stroke-width="2.8" stroke-linecap="round" opacity=".28"/>
 <ellipse cx="482" cy="1280" rx="15" ry="17" fill="#704337" opacity=".12" filter="url(#s)"/><ellipse cx="510" cy="1280" rx="15" ry="17" fill="#704337" opacity=".12" filter="url(#s)"/>
 <path d="M496 1270 C493 1278 493 1286 496 1291" fill="none" stroke="#57362f" stroke-width="2.2" opacity=".27"/>
 </svg>`;

const sideF = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">${defs}
 <!-- right-facing breast, rib cage and abdominal wall -->
 <path d="M505 370 C592 392 660 443 708 515 C650 477 594 463 535 477Z" fill="#efb891" opacity=".065" filter="url(#s)"/>
 <path d="M570 640 C608 659 645 660 674 647" fill="none" stroke="#8b5647" stroke-width="9" opacity=".07"/>
 <ellipse cx="728" cy="566" rx="7" ry="12" fill="#a46157" opacity=".28"/><path d="M733 563 Q738 567 733 571Z" fill="#75453d" opacity=".42"/>
 <path d="M500 735 C550 777 594 800 638 810 M540 824 C575 875 592 928 586 985" fill="none" stroke="#885447" stroke-width="9" opacity=".07" filter="url(#s)"/>
 <path d="M582 995 Q588 1000 595 994" fill="none" stroke="#74473e" stroke-width="2.5" stroke-linecap="round" opacity=".40"/>
 <!-- iliac slope, buttock mass, gluteal fold and side-visible vulvar crease -->
 <path d="M520 1080 C560 1125 585 1180 590 1245" fill="none" stroke="#885447" stroke-width="9" opacity=".065" filter="url(#s)"/>
 <path d="M215 1210 C252 1300 330 1370 438 1394" fill="none" stroke="#885447" stroke-width="13" opacity=".085" filter="url(#s)"/>
 <path d="M305 1502 C350 1530 405 1535 449 1518" fill="none" stroke="#885447" stroke-width="10" opacity=".08" filter="url(#s)"/>
 </svg>`;

const sideM = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774">${defs}
 <path d="M548 632 C596 660 647 658 686 636" fill="none" stroke="#6b4035" stroke-width="11" opacity=".10" filter="url(#s)"/>
 <ellipse cx="700" cy="625" rx="6" ry="9" fill="#72443a" opacity=".28"/><path d="M704 622 Q709 626 704 630Z" fill="#55342e" opacity=".40"/>
 <path d="M505 720 C560 760 605 782 648 790 M550 818 C590 868 610 925 604 980" fill="none" stroke="#6b4035" stroke-width="10" opacity=".09" filter="url(#s)"/>
 <path d="M598 990 Q604 996 611 989" fill="none" stroke="#57362f" stroke-width="2.5" stroke-linecap="round" opacity=".44"/>
 <path d="M530 1070 C570 1115 595 1172 602 1238" fill="none" stroke="#6b4035" stroke-width="10" opacity=".08" filter="url(#s)"/>
 <path d="M275 1225 C307 1290 361 1345 438 1382 M300 1420 C352 1439 410 1438 462 1423" fill="none" stroke="#6b4035" stroke-width="11" opacity=".085" filter="url(#s)"/>
 </svg>`;

const svg = view === 'front' ? (sex === 'm' ? frontM : frontF) : (sex === 'm' ? sideM : sideF);
const rgb = await sharp(source).composite([{ input: Buffer.from(svg) }]).removeAlpha().png().toBuffer();
const alpha = await sharp(source).extractChannel('alpha').raw().toBuffer();
const result = await sharp(rgb).joinChannel(alpha,{raw:{width:meta.width,height:meta.height,channels:1}}).png().toBuffer();
writeFileSync(output,result);
console.log(`posebook: torso candidate written to ${output}`);
