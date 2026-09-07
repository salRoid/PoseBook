// Semantic anatomy contract for the colour-reference assets. The rig itself
// remains a colourless silhouette; these named regions are for colour assets
// and a future layered renderer, never pose geometry.
export const ANATOMY_COLOURS = Object.freeze({
  skin: '#C98F67', contour: '#9A604A', shadow: '#B77759', highlight: '#D9A27C',
  areola: '#8C5144', nipple: '#6F3E37', navel: '#8A5141', vulva: '#9B5961',
});

// A region appears only where it is visible. `external-vulva` is the adult
// external vulva (labia/clitoral area), shown as a restrained medical contour.
export const ANATOMY_REGIONS = Object.freeze({
  'chest-front--m': ['pectorals', 'nipples', 'abs', 'navel'],
  'chest-side--m': ['pectorals', 'nipple', 'abs'],
  'chest-34--m': ['pectorals', 'nipple', 'abs'],
  'chest-back--m': ['trapezius', 'scapulae', 'spine'],
  'chest-front--f': ['breasts', 'areolae', 'nipples', 'upper-abs', 'navel'],
  'chest-side--f': ['breast', 'areola', 'nipple', 'upper-abs'],
  'chest-34--f': ['breast', 'areola', 'nipple', 'upper-abs'],
  'chest-back--f': ['trapezius', 'scapulae', 'spine'],
  'pelvis-front--m': ['lower-abs', 'navel', 'iliac-creases', 'penis'],
  'pelvis-side--m': ['lower-abs', 'iliac-crease', 'glute', 'penis'],
  'pelvis-34--m': ['lower-abs', 'iliac-crease', 'glute', 'penis'],
  'pelvis-back--m': ['glutes', 'sacrum', 'anus'],
  'pelvis-front--f': ['lower-abs', 'navel', 'iliac-creases', 'external-vulva'],
  'pelvis-side--f': ['lower-abs', 'iliac-crease', 'glute'],
  'pelvis-34--f': ['lower-abs', 'iliac-crease', 'glute'],
  'pelvis-back--f': ['glutes', 'sacrum', 'anus'],
});

const PART_DEFAULT_REGIONS = Object.freeze({
  'neck-front': ['sternocleidomastoids', 'trapezius'],
  'neck-side': ['sternocleidomastoid', 'trapezius'],
  'upper-arm': ['deltoid', 'biceps', 'triceps'],
  'upper-arm-fore': ['deltoid', 'biceps'],
  'forearm-hand': ['forearm-flexors', 'wrist', 'hand'],
  thigh: ['quadriceps', 'adductors', 'knee'],
  shin: ['tibialis', 'calf', 'ankle'],
  'foot-front': ['instep', 'toes'],
  'foot-side': ['instep', 'arch', 'toes'],
  'torso-front': ['pectorals', 'nipples', 'abs', 'navel', 'iliac-creases'],
  'torso-side': ['pectoral-or-breast', 'abs', 'navel', 'glute'],
});

export const regionsFor = (part, sex) =>
  ANATOMY_REGIONS[`${part}--${sex}`] ?? PART_DEFAULT_REGIONS[part] ?? [];
