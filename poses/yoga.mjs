// The asana catalogue. Same angle convention as workout.mjs. A pose that IS a
// movement (cat–cow, and eventually surya namaskar) is simply more frames —
// that is the whole reason this library draws from data instead of pictures.
//
// Slugs carry no `yoga-` prefix; Health's catalogue ids do, and the export
// step owns that mapping (an art slug is an asset address, not a catalogue id).

export const YOGA = [
  {
    slug: 'tadasana', name: 'Mountain Pose (Tadasana)', view: 'front',
    frames: [
      {
        torso: 90, neck: 90,
        armL: [-104, -101], armR: [-76, -79],
        legL: [-93, -93, 196], legR: [-87, -87, -16],
      },
    ],
  },
  {
    slug: 'downward-dog', name: 'Downward Dog (Adho Mukha Svanasana)', view: 'side',
    frames: [
      { torso: -38, neck: -70, armNear: [-40, -40], legNear: [-128, -130, -5] },
    ],
  },
  {
    slug: 'warrior-2', name: 'Warrior II (Virabhadrasana II)', view: 'front',
    frames: [
      {
        torso: 90, neck: 90,
        armL: [178, 179], armR: [2, 1],
        legR: [-35, -90, 0],                // bent front leg, shin vertical
        legL: [-128, -130, 196],            // straight back leg
      },
    ],
  },
  {
    slug: 'tree-pose', name: 'Tree Pose (Vrikshasana)', view: 'front',
    frames: [
      {
        torso: 90, neck: 90,
        armL: [75, 86], armR: [105, 94],    // hands meeting overhead
        legR: [-90, -90, -15],              // standing leg
        legL: [-125, -10, -95],             // folded leg, foot to inner thigh
      },
    ],
  },
  {
    slug: 'childs-pose', name: "Child's Pose (Balasana)", view: 'side',
    frames: [
      { torso: -30, bend: 14, neck: -50, armNear: [-25, -3], legNear: [-115, 182, 178] },
    ],
  },
  {
    slug: 'cobra', name: 'Cobra (Bhujangasana)', view: 'side',
    frames: [
      { torso: 48, bend: -16, neck: 64, armNear: [-115, -55], legNear: [184, 182, 176] },
    ],
  },
  {
    slug: 'cat-cow', name: 'Cat–Cow (Marjaryasana–Bitilasana)', view: 'side',
    frames: [
      // cow: belly dips, head up
      { torso: 12, bend: -20, neck: 42, armNear: [-90, -88], legNear: [-90, 178, 175] },
      // cat: spine arches, head drops
      { torso: 12, bend: 22, neck: -46, armNear: [-90, -88], legNear: [-90, 178, 175] },
    ],
  },
];
