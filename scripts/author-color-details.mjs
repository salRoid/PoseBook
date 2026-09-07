#!/usr/bin/env node
// Produce non-destructive anatomical colour references from the flat assets.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANATOMY_COLOURS as BASE, regionsFor } from '../parts/anatomy.mjs';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'parts', 'color-assets');
const OUT = join(SOURCE, 'anatomical');
mkdirSync(OUT, { recursive: true });
const makeSvg = (w, h, inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`);
function details(part, sex, w, h) {
  // The male source set uses a substantially deeper skin tone. Its anatomy
  // needs a warm light contour/shadow to remain legible, not the female-set
  // dark contour reused verbatim.
  const C = sex === 'm'
    ? { ...BASE, skin: '#9A6347', contour: '#E1AA80', shadow: '#D19168', highlight: '#F0C39D', areola: '#754536', nipple: '#5C352D', navel: '#6C4032', vulva: BASE.vulva }
    : { ...BASE, skin: '#CA8F68' };
  const stroke = `fill="none" stroke="${C.contour}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".66"`;
  const x = w / 2;
  const nominal = (baseW, baseH, inner) =>
    `<g transform="scale(${w / baseW} ${h / baseH})">${inner}</g>`;
  // Limb and foot assets are vertically authored to a stable canvas. These
  // percentage-based landmarks survive the differing male/female silhouettes.
  if (part === 'upper-arm' || part === 'upper-arm-fore') {
    if (part === 'upper-arm-fore') return nominal(400, 400, `<ellipse cx="190" cy="105" rx="66" ry="44" fill="${C.shadow}" opacity=".12"/><path d="M115 125Q190 160 270 130M145 185Q202 225 238 315" ${stroke}/>`);
    const top = h * .16, mid = h * .48;
    return `<ellipse cx="${x}" cy="${top}" rx="${w * .20}" ry="${h * .10}" fill="${C.shadow}" opacity=".18"/><path d="M${x - w * .18} ${mid - h * .14}Q${x - w * .06} ${mid} ${x - w * .13} ${mid + h * .16}M${x + w * .18} ${mid - h * .14}Q${x + w * .06} ${mid} ${x + w * .13} ${mid + h * .16}" ${stroke}/>`;
  }
  if (part === 'forearm-hand') return `<path d="M${x - w * .18} ${h * .20}Q${x - w * .05} ${h * .42} ${x - w * .10} ${h * .64}M${x + w * .18} ${h * .20}Q${x + w * .05} ${h * .42} ${x + w * .10} ${h * .64}" ${stroke}/><path d="M${x - w * .18} ${h * .69}H${x + w * .18}" ${stroke}/>`;
  if (part === 'thigh') return `<ellipse cx="${x - w * .14}" cy="${h * .37}" rx="${w * .12}" ry="${h * .22}" fill="${C.shadow}" opacity=".22"/><ellipse cx="${x + w * .14}" cy="${h * .37}" rx="${w * .12}" ry="${h * .22}" fill="${C.shadow}" opacity=".22"/><path d="M${x} ${h * .18}V${h * .72}" ${stroke}/>`;
  if (part === 'shin') return `<ellipse cx="${x - w * .10}" cy="${h * .30}" rx="${w * .16}" ry="${h * .20}" fill="${C.shadow}" opacity=".22"/><path d="M${x + w * .08} ${h * .16}Q${x + w * .15} ${h * .46} ${x + w * .05} ${h * .72}" ${stroke}/>`;
  if (part === 'neck-front' || part === 'neck-side') return `<path d="M${x - w * .18} ${h * .20}Q${x - w * .05} ${h * .48} ${x - w * .24} ${h * .78}M${x + w * .18} ${h * .20}Q${x + w * .05} ${h * .48} ${x + w * .24} ${h * .78}" ${stroke}/>`;
  if (part === 'foot-front') return nominal(300, 300, `<path d="M90 150Q150 128 210 150M100 225Q110 205 120 225M135 235Q145 210 155 235M172 232Q182 212 192 232" ${stroke}/>`);
  if (part === 'foot-side') return nominal(600, 300, `<path d="M145 132Q230 118 315 164M215 220Q300 180 395 215M430 202Q445 184 458 205M462 207Q478 188 490 211M494 212Q510 195 520 217" ${stroke}/>`);
  if (part === 'torso-front') {
    const breast = sex === 'f' ? `<path d="M${x - w * .36} ${h * .31}Q${x - w * .19} ${h * .40} ${x - w * .02} ${h * .32}M${x + w * .02} ${h * .32}Q${x + w * .19} ${h * .40} ${x + w * .36} ${h * .31}" ${stroke}/><circle cx="${x - w * .18}" cy="${h * .34}" r="${w * .025}" fill="${C.areola}"/><circle cx="${x + w * .18}" cy="${h * .34}" r="${w * .025}" fill="${C.areola}"/>` : `<path d="M${x - w * .38} ${h * .31}Q${x - w * .18} ${h * .40} ${x} ${h * .31}Q${x + w * .18} ${h * .40} ${x + w * .38} ${h * .31}" ${stroke}/>`;
    return breast + `<path d="M${x} ${h * .38}V${h * .70}" ${stroke}/><ellipse cx="${x - w * .10}" cy="${h * .52}" rx="${w * .08}" ry="${h * .06}" fill="${C.shadow}" opacity=".2"/><ellipse cx="${x + w * .10}" cy="${h * .52}" rx="${w * .08}" ry="${h * .06}" fill="${C.shadow}" opacity=".2"/><circle cx="${x}" cy="${h * .70}" r="${w * .018}" fill="${C.navel}"/>`;
  }
  if (part === 'torso-side') return `<path d="M${x - w * .12} ${h * .35}Q${x + w * .12} ${h * .42} ${x + w * .20} ${h * .35}M${x} ${h * .47}Q${x + w * .12} ${h * .57} ${x + w * .02} ${h * .70}" ${stroke}/><circle cx="${x + w * .08}" cy="${h * .61}" r="${w * .018}" fill="${C.navel}"/>`;
  if (part === 'chest-front') {
    const cx = 250;
    const chest = sex === 'f'
      ? `<ellipse cx="${cx - 82}" cy="338" rx="52" ry="44" fill="${C.shadow}" opacity=".10"/><ellipse cx="${cx + 82}" cy="338" rx="52" ry="44" fill="${C.shadow}" opacity=".10"/><path d="M105 322Q166 390 240 325M260 325Q334 390 395 322" ${stroke}/><circle cx="${cx - 82}" cy="344" r="9" fill="${C.areola}"/><circle cx="${cx + 82}" cy="344" r="9" fill="${C.areola}"/><circle cx="${cx - 82}" cy="344" r="3" fill="${C.nipple}"/><circle cx="${cx + 82}" cy="344" r="3" fill="${C.nipple}"/>`
      : `<path d="M${cx - 172} 310Q${cx - 85} 366 ${cx - 8} 312M${cx + 8} 312Q${cx + 85} 366 ${cx + 172} 310" ${stroke}/><circle cx="${cx - 92}" cy="325" r="6" fill="${C.nipple}"/><circle cx="${cx + 92}" cy="325" r="6" fill="${C.nipple}"/>`;
    const absYs = sex === 'f' ? [420, 470] : [405, 450, 492];
    const abs = absYs.map((y) =>
      `<ellipse cx="${cx - 35}" cy="${y}" rx="27" ry="20" fill="${C.shadow}" opacity=".22"/><ellipse cx="${cx + 35}" cy="${y}" rx="27" ry="20" fill="${C.shadow}" opacity=".22"/>`).join('');
    return nominal(500, 600, chest + abs + `<path d="M${cx} 390V500" ${stroke}/><circle cx="${cx}" cy="510" r="7" fill="${C.navel}"/>`);
  }
  if (part === 'chest-side') {
    const chest = sex === 'f'
      ? `<ellipse cx="276" cy="318" rx="38" ry="46" fill="${C.shadow}" opacity=".10"/><path d="M222 300Q272 362 320 318" ${stroke}/><circle cx="305" cy="321" r="8" fill="${C.areola}"/><circle cx="305" cy="321" r="3" fill="${C.nipple}"/>`
      : `<path d="M205 295Q266 340 320 300" ${stroke}/><circle cx="300" cy="307" r="4" fill="${C.nipple}"/>`;
    return nominal(400, 600, chest + `<path d="M205 380Q236 407 255 384M198 430Q225 454 245 434M180 360Q195 420 182 485" ${stroke}/>`);
  }
  if (part === 'chest-34') {
    const chest = sex === 'f'
      ? `<ellipse cx="322" cy="320" rx="48" ry="44" fill="${C.shadow}" opacity=".10"/><path d="M170 308Q215 354 252 318M254 316Q320 375 382 310" ${stroke}/><circle cx="337" cy="328" r="8" fill="${C.areola}"/><circle cx="337" cy="328" r="3" fill="${C.nipple}"/>`
      : `<path d="M142 300Q205 350 252 310M255 310Q322 360 395 298" ${stroke}/><circle cx="342" cy="318" r="4" fill="${C.nipple}"/>`;
    return nominal(500, 600, chest + `<path d="M247 375Q258 435 270 510M205 408Q242 430 270 408M218 458Q252 478 280 452" ${stroke}/>`);
  }
  if (part === 'chest-back') return nominal(500, 600, `<path d="M250 145V495M130 220C160 195 195 200 220 235C205 270 195 305 175 330C145 315 125 290 115 255M370 220C340 195 305 200 280 235C295 270 305 305 325 330C355 315 375 290 385 255M115 385Q165 345 215 380M385 385Q335 345 285 380" ${stroke}/>`);
  if (part === 'pelvis-front') {
    const cx = 250;
    const genital = sex === 'f'
      ? `<path d="M${cx} 325C${cx - 24} 348 ${cx - 20} 380 ${cx} 400C${cx + 20} 380 ${cx + 24} 348 ${cx} 325Z" fill="${C.vulva}" opacity=".82"/><path d="M${cx} 340V386" stroke="${C.nipple}" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M${cx - 10} 302Q${cx} 294 ${cx + 10} 302L${cx + 9} 360Q${cx} 374 ${cx - 9} 360Z" fill="${C.shadow}" opacity=".92"/><ellipse cx="${cx}" cy="364" rx="12" ry="10" fill="${C.contour}" opacity=".96"/><ellipse cx="${cx - 11}" cy="382" rx="13" ry="16" fill="${C.shadow}" opacity=".88"/><ellipse cx="${cx + 11}" cy="382" rx="13" ry="16" fill="${C.shadow}" opacity=".88"/><path d="M${cx} 307V365" stroke="${C.highlight}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    return nominal(500, 500, `<circle cx="${cx}" cy="118" r="7" fill="${C.navel}"/><path d="M${cx} 145V278M${cx - 118} 190Q${cx - 65} 225 ${cx - 40} 275M${cx + 118} 190Q${cx + 65} 225 ${cx + 40} 275" ${stroke}/>${genital}`);
  }
  if (part === 'pelvis-side' || part === 'pelvis-34') {
    if (part === 'pelvis-side') {
      const penis = sex === 'm' ? `<path d="M270 325Q290 330 292 358Q283 370 273 358Z" fill="${C.shadow}" opacity=".72"/>` : '';
      return nominal(400, 500, `<circle cx="245" cy="125" r="6" fill="${C.navel}"/><path d="M215 210Q250 248 290 220M82 275Q125 350 188 315M220 275Q245 305 270 288" ${stroke}/>${penis}`);
    }
    const penis = sex === 'm' ? `<path d="M278 325Q298 332 296 360Q286 372 276 358Z" fill="${C.shadow}" opacity=".70"/>` : '';
    return nominal(500, 500, `<circle cx="270" cy="122" r="6" fill="${C.navel}"/><path d="M140 220Q205 265 252 238M360 195Q315 235 285 282M105 300Q175 375 252 330" ${stroke}/>${penis}`);
  }
  return nominal(500, 500, `<path d="M250 145V315M70 280Q145 390 238 325M430 280Q355 390 262 325" ${stroke}/><path d="M230 285Q250 265 270 285L266 350Q250 360 234 350Z" fill="${C.skin}"/><ellipse cx="250" cy="320" rx="4" ry="6" fill="${C.nipple}" opacity=".82"/>`);
}

let wrote = 0;
for (const file of readdirSync(SOURCE).filter((f) => f.endsWith('.png'))) {
  const [part, sex] = basename(file, '.png').split('--');
  const input = join(SOURCE, file), meta = await sharp(input).metadata();
  // Head assets intentionally have no facial features in the rig contract;
  // still copy them so the reviewed anatomical set is a complete drop-in set.
  if (!regionsFor(part, sex).length) {
    writeFileSync(join(OUT, file), await sharp(input).png().toBuffer());
    wrote++;
    continue;
  }
  // Keep markings inside the source's real silhouette. Each source has a
  // slightly different contour, so this is essential after view-specific
  // placement: no areola, crease, or line may float over transparency.
  const anatomy = makeSvg(meta.width, meta.height, details(part, sex, meta.width, meta.height));
  const layers = [{ input: anatomy }];
  // The male front pelvis needs an external genital extension into the crotch;
  // every other asset remains clipped to its source silhouette.
  if (!((part === 'pelvis-front' && sex === 'm') || part === 'pelvis-back')) {
    layers.push({ input, blend: 'dest-in' });
  }
  writeFileSync(join(OUT, file), await sharp(input)
    .ensureAlpha()
    .composite(layers)
    .png().toBuffer());
  wrote++;
}
console.log(`posebook: ${wrote} anatomical colour assets written to parts/color-assets/anatomical`);
