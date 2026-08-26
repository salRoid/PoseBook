// The workout catalogue. A pose is joint angles — absolute degrees, 0 = the
// direction the figure faces (+x), 90 = up, -90 = down. `frames` follows the
// everkinetic convention the Health renderer already speaks: frame 1 is the
// start/relaxation position, frame 2 the effort/tension position; more frames
// are legal (the renderer derives the cycle from the count).
//
// Fixing a pose means editing a number here and rebuilding — never touching
// the engine, and never regenerating anything.

const STAND = { torso: 90, neck: 90, armNear: [-87, -87], legNear: [-90, -90, 0] };

export const WORKOUT = [
  {
    slug: 'squat', name: 'Bodyweight Squat', view: 'side',
    frames: [
      { ...STAND, armNear: [-80, -70] },
      { torso: 62, neck: 78, armNear: [-8, 2], legNear: [-38, -128, 0] },
    ],
  },
  {
    slug: 'push-up', name: 'Push-Up', view: 'side',
    frames: [
      { torso: 14, neck: 22, armNear: [-86, -90], legNear: [-160, -163, -100] },
      { torso: 8, neck: 26, armNear: [-168, -62], legNear: [-166, -169, -102] },
    ],
  },
  {
    slug: 'deadlift', name: 'Deadlift', view: 'side',
    frames: [
      { torso: 38, neck: 55, armNear: [-85, -88], legNear: [-55, -108, 0], props: [{ type: 'barbell' }] },
      { torso: 88, neck: 90, armNear: [-90, -90], legNear: [-90, -90, 0], props: [{ type: 'barbell' }] },
    ],
  },
  {
    slug: 'plank', name: 'Plank', view: 'side',
    frames: [
      { torso: 11, neck: 18, armNear: [-95, 4], legNear: [-162, -165, -100] },
    ],
  },
  {
    slug: 'lunge', name: 'Lunge', view: 'side',
    frames: [
      STAND,
      {
        torso: 85, neck: 88,
        armNear: [-85, -85],
        legNear: [-50, -95, 0],            // front leg: shin vertical
        legFar: [-125, -140, -80],          // rear leg: knee dropped, heel up
      },
    ],
  },
  {
    slug: 'overhead-press', name: 'Overhead Press', view: 'front',
    frames: [
      {
        torso: 90, neck: 90,
        armL: [-118, 102], armR: [-62, 78],
        legL: [-95, -95, 195], legR: [-85, -85, -15],
        props: [{ type: 'barbell-front' }],
      },
      {
        torso: 90, neck: 90,
        armL: [96, 91], armR: [84, 89],
        legL: [-95, -95, 195], legR: [-85, -85, -15],
        props: [{ type: 'barbell-front' }],
      },
    ],
  },
  {
    slug: 'biceps-curl', name: 'Biceps Curl', view: 'side',
    frames: [
      { torso: 90, neck: 90, armNear: [-82, -80], legNear: [-90, -90, 0], props: [{ type: 'dumbbell' }] },
      { torso: 90, neck: 90, armNear: [-82, 42], legNear: [-90, -90, 0], props: [{ type: 'dumbbell' }] },
    ],
  },
  {
    slug: 'bench-press', name: 'Bench Press', view: 'side', ground: true,
    frames: [
      {
        torso: 2, neck: 6,
        armNear: [-155, 82],                // bar at chest: elbow down, forearm up
        legNear: [205, -95, 178],           // feet on the floor past the bench
        props: [{ type: 'bench' }, { type: 'barbell' }],
      },
      {
        torso: 2, neck: 6,
        armNear: [86, 88],                  // lockout: arm straight up
        legNear: [205, -95, 178],
        props: [{ type: 'bench' }, { type: 'barbell' }],
      },
    ],
  },
  {
    slug: 'crunch', name: 'Crunch', view: 'side',
    frames: [
      { torso: 4, neck: 14, armNear: [172, 168], legNear: [148, -124, 178] },
      { torso: 24, bend: -10, neck: 46, armNear: [178, 172], legNear: [148, -124, 178] },
    ],
  },
];
