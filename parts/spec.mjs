// THE PARTS SPEC — the single source of truth for what the body-part library
// contains. `npm run missing` prints prompts from it, `npm run ingest`
// validates against it, and the engine maps rig bones onto it. Restating any
// of this in a doc is the drift Foodsum's STYLE.md rule exists to prevent:
// docs point here.
//
// Each part is drawn ONCE per body and reused in every frame of every
// exercise — that is why generating parts is safe where generating poses was
// not. Anchors are a CONVENTION: the part must be drawn so its joints sit at
// these canvas coordinates. Nothing is detected; off-anchor parts assemble
// into a visibly dislocated body on the contact sheet.

/** @type {{slug:string, w:number, h:number, a:[number,number], b:[number,number], desc:string, anchorNote:string}[]} */
// ── SPEC v2 — the fully articulated body ────────────────────────────────────
// v1 was scoped to exercise frames. v2 is scoped to ANY pose: the trunk
// splits at the WAIST (chest + pelvis, so spines bend and hips counter-
// rotate), the neck is its own joint, hands and feet are separate parts with
// STATES (a grip sells a barbell; a pointed foot sells a cobra), and parts
// that read differently when the body turns get VIEWS (side / front / back /
// three-quarter). Limbs are near-cylindrical so they need only a profile plus
// a FORESHORTENED variant for pointing toward the viewer.
//
// The four legacy v1 parts at the bottom keep today's engine rendering while
// the v2 engine (waist + neck bones, state/view selection) is built.

/** @type {{slug:string, w:number, h:number, a:[number,number], b:[number,number], desc:string, anchorNote:string, legacy?:boolean}[]} */
export const PARTS = [
  // ── head, four views ──
  { slug: 'head-side',  w: 400, h: 800, a: [200, 700], b: [200, 150],
    desc: 'profile head with a short neck stub, facing right',
    anchorNote: 'base of the neck at the bottom-center, crown of the head at the top' },
  { slug: 'head-front', w: 400, h: 800, a: [200, 700], b: [200, 150],
    desc: 'head with a short neck stub, facing the viewer',
    anchorNote: 'base of the neck at the bottom-center, crown at the top' },
  { slug: 'head-back',  w: 400, h: 800, a: [200, 700], b: [200, 150],
    desc: 'head with a short neck stub, seen from BEHIND (back of the head, hair only)',
    anchorNote: 'base of the neck at the bottom-center, crown at the top' },
  { slug: 'head-34',    w: 400, h: 800, a: [200, 700], b: [200, 150],
    desc: 'head with a short neck stub, three-quarter view turned 45 degrees to the right',
    anchorNote: 'base of the neck at the bottom-center, crown at the top' },

  // ── neck ──
  { slug: 'neck-side',  w: 300, h: 400, a: [150, 340], b: [150, 60],
    desc: 'neck only, in profile facing right, with the trapezius slope at its base',
    anchorNote: 'base of the neck (shoulders) at the bottom, skull base at the top' },
  { slug: 'neck-front', w: 300, h: 400, a: [150, 340], b: [150, 60],
    desc: 'neck only, facing the viewer, with the trapezius slopes at its base',
    anchorNote: 'base at the bottom, skull base at the top' },

  // ── chest (ribcage, shoulders → waist), four views ──
  { slug: 'chest-side',  w: 400, h: 600, a: [200, 520], b: [200, 90],
    sexNote: { m: 'a defined pectoral mass at the front of the chest', f: 'the bust drawn as a clear rounded curve at the front of the chest profile' },
    desc: 'upper torso in profile facing right — ribcage, chest and upper back from the shoulders down to the natural waist, no limbs, no head, no hips',
    anchorNote: 'waist at the bottom-center, base of the neck at the top' },
  { slug: 'chest-front', w: 500, h: 600, a: [250, 520], b: [250, 90],
    sexNote: { m: 'broad pectoral plane tapering to the waist', f: 'the bust contour shaping the sides of the chest, tapering to a narrower waist' },
    desc: 'upper torso facing the viewer — shoulders, chest and ribcage down to the natural waist, no limbs, no head, no hips',
    anchorNote: 'waist at the bottom-center, base of the neck at the top' },
  { slug: 'chest-back',  w: 500, h: 600, a: [250, 520], b: [250, 90],
    sexNote: { m: 'a wide V-taper from shoulders to waist', f: 'a softer taper from shoulders to a narrower waist' },
    desc: 'upper back seen from BEHIND — shoulders, shoulder blades and back down to the natural waist, no limbs, no head, no hips',
    anchorNote: 'waist at the bottom-center, base of the neck at the top' },
  { slug: 'chest-34',    w: 500, h: 600, a: [250, 520], b: [250, 90],
    sexNote: { m: 'the near pectoral in three-quarter profile', f: 'the near side of the bust in three-quarter profile' },
    desc: 'upper torso in three-quarter view turned 45 degrees — chest and one shoulder forward, down to the natural waist, no limbs, no head, no hips',
    anchorNote: 'waist at the bottom-center, base of the neck at the top' },

  // ── pelvis (waist → hips), four views ──
  { slug: 'pelvis-side',  w: 400, h: 500, a: [200, 420], b: [200, 80],
    sexNote: { m: 'a firm rounded glute curve at the back', f: 'a full rounded glute curve at the back and a curved lower belly at the front' },
    desc: 'pelvis and hips in profile facing right — waist down through the glutes to the tops of the thighs, no legs, no upper body',
    anchorNote: 'hip joint at the bottom-center, waist at the top' },
  { slug: 'pelvis-front', w: 500, h: 500, a: [250, 420], b: [250, 80],
    sexNote: { m: 'hips narrower than the shoulders', f: 'hips wider than the waist by a clear margin, rounded at the sides' },
    desc: 'pelvis and hips facing the viewer — waist down to the tops of the thighs, no legs, no upper body',
    anchorNote: 'hip line at the bottom-center, waist at the top' },
  { slug: 'pelvis-back',  w: 500, h: 500, a: [250, 420], b: [250, 80],
    sexNote: { m: 'rounded glutes below the waist taper', f: 'full rounded glutes dominating the shape below the waist' },
    desc: 'pelvis and glutes seen from BEHIND — waist down to the tops of the thighs, no legs, no upper body',
    anchorNote: 'hip line at the bottom-center, waist at the top' },
  { slug: 'pelvis-34',    w: 500, h: 500, a: [250, 420], b: [250, 80],
    sexNote: { m: 'the near glute curve visible in three-quarter view', f: 'the near hip and glute curve prominent in three-quarter view' },
    desc: 'pelvis and hips in three-quarter view turned 45 degrees, waist to tops of thighs, no legs, no upper body',
    anchorNote: 'hip line at the bottom-center, waist at the top' },

  // ── arms ──
  { slug: 'upper-arm',      w: 300, h: 800, a: [150, 100], b: [150, 700],
    desc: 'upper arm ONLY, from shoulder to elbow and NOTHING below the elbow — deltoid fuller at the top, vertical, no forearm, no hand',
    anchorNote: 'shoulder joint near the top, elbow near the bottom' },
  { slug: 'upper-arm-fore', w: 400, h: 400, a: [200, 90],  b: [200, 320],
    desc: 'upper arm FORESHORTENED, pointing toward the viewer — the deltoid a large near circle, the elbow end small behind it',
    anchorNote: 'shoulder at the top, elbow below it, strongly compressed' },
  { slug: 'forearm',        w: 300, h: 700, a: [150, 90],  b: [150, 620],
    desc: 'forearm ONLY, from elbow to wrist, tapering toward the wrist, vertical, no hand',
    anchorNote: 'elbow near the top, wrist near the bottom' },
  { slug: 'forearm-fore',   w: 400, h: 400, a: [200, 90],  b: [200, 320],
    desc: 'forearm FORESHORTENED, pointing toward the viewer — elbow end large, wrist small behind it, no hand',
    anchorNote: 'elbow at the top, wrist below it, strongly compressed' },

  // ── hands, four states ──
  { slug: 'hand-relaxed', w: 300, h: 400, a: [150, 60],  b: [150, 340],
    desc: 'a relaxed hand seen from the side, fingers gently curled, wrist at the top pointing down',
    anchorNote: 'wrist at the top, fingertips at the bottom' },
  { slug: 'hand-open',    w: 300, h: 400, a: [150, 60],  b: [150, 340],
    desc: 'an open flat hand, palm down as if pressing the floor, wrist at the top',
    anchorNote: 'wrist at the top, fingertips at the bottom' },
  { slug: 'hand-grip',    w: 300, h: 400, a: [150, 60],  b: [150, 340],
    desc: 'a hand closed in a grip around an invisible horizontal bar, seen from the side, wrist at the top',
    anchorNote: 'wrist at the top, the gripped bar axis at the bottom-center' },
  { slug: 'hand-fist',    w: 300, h: 400, a: [150, 60],  b: [150, 340],
    desc: 'a closed fist seen from the side, wrist at the top',
    anchorNote: 'wrist at the top, knuckles at the bottom' },

  // ── legs ──
  { slug: 'thigh',      w: 300, h: 800, a: [150, 100], b: [150, 700],
    desc: 'thigh ONLY, from hip to knee, quad sweep fuller at the top, vertical, no shin',
    anchorNote: 'hip joint near the top, knee near the bottom' },
  { slug: 'thigh-fore', w: 400, h: 400, a: [200, 90],  b: [200, 320],
    desc: 'thigh FORESHORTENED, pointing toward the viewer — hip end large, knee small behind it',
    anchorNote: 'hip at the top, knee below it, strongly compressed' },
  { slug: 'shin',       w: 300, h: 800, a: [150, 100], b: [150, 700],
    desc: 'lower leg ONLY, from knee to ankle with a calf curve, vertical, no foot',
    anchorNote: 'knee near the top, ankle near the bottom' },
  { slug: 'shin-fore',  w: 400, h: 400, a: [200, 90],  b: [200, 320],
    desc: 'lower leg FORESHORTENED, pointing toward the viewer — knee end large, ankle small behind it',
    anchorNote: 'knee at the top, ankle below it, strongly compressed' },

  // ── feet, three states ──
  { slug: 'foot-flat',  w: 600, h: 300, a: [170, 120], b: [500, 150],
    desc: 'foot in profile pointing right, sole flat on the ground, heel to toes',
    anchorNote: 'ankle above the heel, toe tip at the right' },
  { slug: 'foot-point', w: 600, h: 300, a: [140, 90],  b: [520, 200],
    desc: 'foot in profile pointing right with the toes POINTED (plantarflexed), as in a cobra pose or a kick',
    anchorNote: 'ankle at the upper left, pointed toe tip at the lower right' },
  { slug: 'foot-front', w: 300, h: 300, a: [150, 80],  b: [150, 240],
    desc: 'bare foot seen from the front, foreshortened',
    anchorNote: 'ankle at the top, toes at the bottom' },

  // ── feet in TRAINING SHOES — workouts are done shod; yoga barefoot.
  //    In a silhouette, footwear is the attire that actually reads: the
  //    trunk and limbs are dress-neutral shapes either way. ──
  { slug: 'foot-flat-shoe',  w: 600, h: 300, a: [170, 110], b: [510, 150],
    desc: 'foot wearing a low training shoe, in profile pointing right, sole flat on the ground — a clear sneaker silhouette with a slight sole line',
    anchorNote: 'ankle above the heel, shoe toe at the right' },
  { slug: 'foot-front-shoe', w: 300, h: 300, a: [150, 80],  b: [150, 250],
    desc: 'foot wearing a low training shoe seen from the front, foreshortened',
    anchorNote: 'ankle at the top, shoe toe at the bottom' },

  // ── v1 legacy — today's engine renders these; superseded by chest+pelvis
  //    and forearm+hand once the v2 engine lands. Not in the queue. ──
  { slug: 'torso-side',   w: 400, h: 800, a: [200, 700], b: [200, 150], legacy: true,
    desc: 'full trunk in profile (v1)', anchorNote: 'pelvis at the bottom, chest at the top' },
  { slug: 'torso-front',  w: 500, h: 800, a: [250, 700], b: [250, 150], legacy: true,
    desc: 'full trunk facing the viewer (v1)', anchorNote: 'pelvis at the bottom, collarbone at the top' },
  { slug: 'forearm-hand', w: 300, h: 800, a: [150, 100], b: [150, 620], legacy: true,
    desc: 'forearm ending in a relaxed hand (v1)', anchorNote: 'elbow at the top, wrist above the hand' },
  { slug: 'foot-side',    w: 600, h: 300, a: [170, 120], b: [500, 150], legacy: true,
    desc: 'flat profile foot (v1 name)', anchorNote: 'ankle, toe' },
];

/**
 * AUTO-REGISTRATION — where each part's joints sit within its own INK, as
 * fractions of the ink bounding box along `axis` (0 = top/left, 1 =
 * bottom/right). Ingest measures the traced silhouette and computes the real
 * anchors from these, because a generative model cannot hit exact pixel
 * coordinates and a convention nobody can follow is not a convention. The
 * across-axis coordinate is the ink's centroid at that row/column, so a
 * profile head's neck registers under the SKULL, not at the bbox centre.
 */
// Anchors sit WELL INSIDE the ink (10-12% in), for two load-bearing reasons
// found by looking at the first full assembly: the ink beyond each anchor is
// what OVERLAPS the neighbouring part at a bent joint (at 5% the figure came
// apart into floating slivers), and pulling the anchors inward scales every
// part up ~16% to the mass the figure actually needs.
export const REG = {
  'head-side':   { axis: 'y', aFrac: 0.95, bFrac: 0.04 },
  'head-front':  { axis: 'y', aFrac: 0.95, bFrac: 0.04 },
  'head-back':   { axis: 'y', aFrac: 0.95, bFrac: 0.04 },
  'head-34':     { axis: 'y', aFrac: 0.95, bFrac: 0.04 },
  'neck-side':   { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'neck-front':  { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'chest-side':  { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'chest-front': { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'chest-back':  { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'chest-34':    { axis: 'y', aFrac: 0.92, bFrac: 0.08 },
  'pelvis-side': { axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'pelvis-front':{ axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'pelvis-back': { axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'pelvis-34':   { axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'upper-arm':      { axis: 'y', aFrac: 0.12, bFrac: 0.88 },
  'upper-arm-fore': { axis: 'y', aFrac: 0.20, bFrac: 0.80 },
  'forearm':        { axis: 'y', aFrac: 0.12, bFrac: 0.88 },
  'forearm-fore':   { axis: 'y', aFrac: 0.20, bFrac: 0.80 },
  'hand-relaxed': { axis: 'y', aFrac: 0.10, bFrac: 0.85 },
  'hand-open':    { axis: 'y', aFrac: 0.10, bFrac: 0.85 },
  'hand-grip':    { axis: 'y', aFrac: 0.10, bFrac: 0.85 },
  'hand-fist':    { axis: 'y', aFrac: 0.10, bFrac: 0.85 },
  'thigh':      { axis: 'y', aFrac: 0.12, bFrac: 0.88 },
  'thigh-fore': { axis: 'y', aFrac: 0.20, bFrac: 0.80 },
  'shin':       { axis: 'y', aFrac: 0.12, bFrac: 0.88 },
  'shin-fore':  { axis: 'y', aFrac: 0.20, bFrac: 0.80 },
  'foot-flat':  { axis: 'x', aFrac: 0.18, bFrac: 0.94 },
  'foot-point': { axis: 'x', aFrac: 0.12, bFrac: 0.95 },
  'foot-front': { axis: 'y', aFrac: 0.15, bFrac: 0.85 },
  'foot-flat-shoe':  { axis: 'x', aFrac: 0.18, bFrac: 0.94 },
  'foot-front-shoe': { axis: 'y', aFrac: 0.15, bFrac: 0.85 },
  // legacy
  'torso-side':   { axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'torso-front':  { axis: 'y', aFrac: 0.90, bFrac: 0.10 },
  'forearm-hand': { axis: 'y', aFrac: 0.10, bFrac: 0.66 },
  'foot-side':    { axis: 'x', aFrac: 0.18, bFrac: 0.94 },
};

export const SEXES = /** @type {const} */ ([
  { key: 'm', word: 'male', build: 'broader shoulders, thicker limbs' },
  { key: 'f', word: 'female', build: 'narrower shoulders, wider hips, slimmer limbs' },
]);

/** `thigh--f.png` — the only filename ingest accepts. */
export const fileFor = (part, sex) => `${part}--${sex}.png`;

export function promptFor(part, sex) {
  const hair = sex.key === 'f' && part.slug.startsWith('head')
    ? ', hair drawn as a simple bun' : '';
  // Learned from the synthetic-part plumbing test: a limb that does not fill
  // its canvas width scales down to a sliver on the short rig bones. Say so.
  const anatomy = part.sexNote ? ` Anatomically true silhouette: ${part.sexNote[sex.key]}.` : '';
  const limb = ['upper-arm', 'forearm', 'forearm-hand', 'thigh', 'shin'].includes(part.slug);
  const fill = limb
    ? ' The limb is thick and fills roughly half the canvas width at its widest point.'
    : ' The silhouette fills the canvas generously.';
  return (
    `Flat vector-style solid black silhouette of a single human ${sex.word} ` +
    `${part.desc}${hair}. Smooth stylised anatomy, rounded and slightly ` +
    `overlong joint ends so parts can overlap at the joints. ${sex.build}. ` +
    `No outline, no shading, no gradient, no background, no face features.` +
    `${anatomy}${fill} Canvas ${part.w}x${part.h}, drawn so the ${part.anchorNote}.`
  );
}
