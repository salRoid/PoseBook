#!/usr/bin/env node
// Individually authored anatomy anchor. This deliberately does not generalise
// coordinates across views: every accepted asset gets its own inspected map.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sex = process.argv[2] === 'm' ? 'm' : 'f';
const source = join(ROOT, 'parts', 'color-assets', `chest-side--${sex}.png`);
const outDir = '/tmp';
const output = join(outDir, `posebook-chest-side--${sex}-anchor.png`);

const femaleOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <defs>
    <linearGradient id="upper" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#efc19d" stop-opacity=".10"/>
      <stop offset="1" stop-color="#d79a72" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="under" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#8f5745" stop-opacity="0"/>
      <stop offset="1" stop-color="#8f5745" stop-opacity=".24"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="softSmall"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>

  <!-- breast modeling follows its attachment, upper slope and gravity -->
  <path d="M620 430 C745 415 855 510 946 625 C860 540 780 505 670 515Z" fill="url(#upper)" filter="url(#soft)"/>
  <path d="M735 757 C765 780 790 789 811 782 C792 796 765 793 742 775Z" fill="url(#under)" opacity=".58" filter="url(#softSmall)"/>

  <!-- side-view areola is a narrow ellipse on the breast apex -->
  <ellipse cx="957" cy="649" rx="9" ry="15" fill="#a96559" opacity=".54" filter="url(#softSmall)"/>
  <ellipse cx="957" cy="649" rx="7" ry="13" fill="#9c5d52" opacity=".48"/>
  <path d="M966 645 Q973 650 966 655Z" fill="#75453d" opacity=".62"/>
  <ellipse cx="954" cy="644" rx="2.5" ry="4" fill="#d58f7f" opacity=".22"/>

  <!-- restrained rib arc and oblique, fading before the lower abdomen -->
  <path d="M605 748 C650 790 705 825 758 842 L744 864 C690 844 640 808 596 765Z" fill="#925846" opacity=".12" filter="url(#softSmall)"/>
  <path d="M655 855 C690 900 716 958 712 1015 L686 1018 C694 960 676 912 642 872Z" fill="#925846" opacity=".12" filter="url(#softSmall)"/>
  <ellipse cx="751" cy="1040" rx="18" ry="11" fill="#925846" opacity=".045" filter="url(#softSmall)"/>
  <path d="M748 1040 Q751 1043 755 1039" fill="none" stroke="#805044" stroke-width="2" stroke-linecap="round" opacity=".36"/>
</svg>`;

const maleOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <defs>
    <linearGradient id="pecTop" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#d89a71" stop-opacity=".13"/><stop offset="1" stop-color="#b07052" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="pecFold" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#714436" stop-opacity="0"/><stop offset="1" stop-color="#714436" stop-opacity=".24"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="13"/></filter>
    <filter id="small"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <!-- pectoral volume follows the right-facing ribcage and anterior apex -->
  <path d="M690 455 C800 485 900 560 970 625 L950 650 C875 580 790 540 700 525Z" fill="url(#pecTop)" filter="url(#small)"/>
  <path d="M760 650 C830 695 900 715 955 680 C920 720 850 735 785 700Z" fill="url(#pecFold)" filter="url(#small)"/>
  <ellipse cx="976" cy="638" rx="7" ry="12" fill="#75483d" opacity=".38"/>
  <path d="M982 634 Q988 638 982 642Z" fill="#57352f" opacity=".50"/>
  <!-- lower-rib edge and external oblique taper into the waist -->
  <path d="M670 755 C715 790 760 812 805 824 L795 840 C750 828 708 805 666 770Z" fill="#714436" opacity=".075" filter="url(#small)"/>
  <path d="M720 850 C754 900 774 948 768 995 L750 1000 C756 950 742 908 710 870Z" fill="#714436" opacity=".075" filter="url(#small)"/>
  <ellipse cx="766" cy="1034" rx="16" ry="10" fill="#714436" opacity=".04" filter="url(#small)"/>
  <path d="M763 1035 Q767 1038 771 1034" fill="none" stroke="#5f392f" stroke-width="2" stroke-linecap="round" opacity=".36"/>
</svg>`;

const overlay = Buffer.from(sex === 'm' ? maleOverlay : femaleOverlay);

// Composite colour only, then restore the source alpha channel byte-for-byte.
// `dest-in` multiplies alpha and subtly changes a 254 matte into 253.
const rgb = await sharp(source).composite([{ input: overlay }]).removeAlpha().png().toBuffer();
const alpha = await sharp(source).ensureAlpha().extractChannel('alpha').raw().toBuffer();
const result = await sharp(rgb).joinChannel(alpha, { raw: { width: 1024, height: 1536, channels: 1 } }).png().toBuffer();
writeFileSync(output, result);
console.log(`posebook: side-profile anatomy anchor written to ${output}`);
