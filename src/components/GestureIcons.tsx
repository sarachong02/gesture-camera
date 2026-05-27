type LandmarkPoint = [number, number];

// MediaPipe standard hand connections
const CONNECTIONS: [number, number][] = [
  [0, 1],  [1, 2],  [2, 3],  [3, 4],
  [0, 5],  [5, 6],  [6, 7],  [7, 8],
  [5, 9],  [9, 10], [10, 11],[11, 12],
  [9, 13], [13, 14],[14, 15],[15, 16],
  [13, 17],[17, 18],[18, 19],[19, 20],
  [0, 17],
];

const TIPS = new Set([4, 8, 12, 16, 20]);
const MAJORS = new Set([0, 1, 5, 9, 13, 17]);

function HandSkeleton({ lm, className = "w-24 h-28" }: { lm: LandmarkPoint[]; className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden fill="none">
      {CONNECTIONS.map(([a, b], i) => (
        <line
          key={i}
          x1={lm[a][0]} y1={lm[a][1]}
          x2={lm[b][0]} y2={lm[b][1]}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}
      {lm.map(([x, y], i) => {
        const r = TIPS.has(i) ? 3.5 : MAJORS.has(i) ? 3 : 2;
        return (
          <circle
            key={i}
            cx={x} cy={y} r={r}
            fill="white"
            opacity={TIPS.has(i) ? 1 : 0.75}
          />
        );
      })}
    </svg>
  );
}

// All fingers extended, natural spread
const OPEN_PALM_LM: LandmarkPoint[] = [
  [50, 108], // 0 WRIST
  [33, 96],  // 1 THUMB_CMC
  [22, 83],  // 2 THUMB_MCP
  [14, 69],  // 3 THUMB_IP
  [9,  55],  // 4 THUMB_TIP
  [38, 82],  // 5 INDEX_MCP
  [36, 63],  // 6 INDEX_PIP
  [35, 46],  // 7 INDEX_DIP
  [34, 30],  // 8 INDEX_TIP
  [50, 80],  // 9 MIDDLE_MCP
  [50, 60],  // 10 MIDDLE_PIP
  [50, 42],  // 11 MIDDLE_DIP
  [50, 24],  // 12 MIDDLE_TIP
  [62, 82],  // 13 RING_MCP
  [64, 63],  // 14 RING_PIP
  [65, 46],  // 15 RING_DIP
  [66, 30],  // 16 RING_TIP
  [72, 90],  // 17 PINKY_MCP
  [76, 74],  // 18 PINKY_PIP
  [79, 61],  // 19 PINKY_DIP
  [81, 49],  // 20 PINKY_TIP
];

// Index + middle extended, ring + pinky curled toward palm
const PEACE_SIGN_LM: LandmarkPoint[] = [
  [50, 108], // 0 WRIST
  [33, 96],  // 1 THUMB_CMC
  [22, 83],  // 2 THUMB_MCP
  [14, 69],  // 3 THUMB_IP
  [10, 60],  // 4 THUMB_TIP
  [38, 82],  // 5 INDEX_MCP
  [36, 63],  // 6 INDEX_PIP
  [35, 46],  // 7 INDEX_DIP
  [34, 30],  // 8 INDEX_TIP
  [50, 80],  // 9 MIDDLE_MCP
  [50, 60],  // 10 MIDDLE_PIP
  [50, 42],  // 11 MIDDLE_DIP
  [50, 24],  // 12 MIDDLE_TIP
  [62, 82],  // 13 RING_MCP — curled below
  [65, 88],  // 14 RING_PIP
  [62, 97],  // 15 RING_DIP
  [58, 103], // 16 RING_TIP
  [72, 90],  // 17 PINKY_MCP — curled below
  [76, 96],  // 18 PINKY_PIP
  [74, 105], // 19 PINKY_DIP
  [70, 109], // 20 PINKY_TIP
];

// Thumb extended downward (thumbs-up flipped 180°), all four fingers curled
const THUMBS_DOWN_LM: LandmarkPoint[] = [
  [45,  7],  // 0 WRIST
  [57, 19],  // 1 THUMB_CMC
  [67, 32],  // 2 THUMB_MCP
  [75, 48],  // 3 THUMB_IP
  [80, 65],  // 4 THUMB_TIP (pointing down)
  [46, 37],  // 5 INDEX_MCP
  [43, 30],  // 6 INDEX_PIP
  [45, 20],  // 7 INDEX_DIP
  [48, 14],  // 8 INDEX_TIP
  [37, 39],  // 9 MIDDLE_MCP
  [34, 31],  // 10 MIDDLE_PIP
  [36, 21],  // 11 MIDDLE_DIP
  [39, 16],  // 12 MIDDLE_TIP
  [28, 36],  // 13 RING_MCP
  [26, 28],  // 14 RING_PIP
  [28, 19],  // 15 RING_DIP
  [31, 13],  // 16 RING_TIP
  [21, 29],  // 17 PINKY_MCP
  [18, 21],  // 18 PINKY_PIP
  [20, 13],  // 19 PINKY_DIP
  [23,  9],  // 20 PINKY_TIP
];

// Thumb extended upward, all four fingers curled into fist
const THUMBS_UP_LM: LandmarkPoint[] = [
  [55, 113], // 0 WRIST
  [43, 101], // 1 THUMB_CMC
  [33, 88],  // 2 THUMB_MCP
  [25, 72],  // 3 THUMB_IP
  [20, 55],  // 4 THUMB_TIP (extended up)
  [54, 83],  // 5 INDEX_MCP — fist knuckles
  [57, 90],  // 6 INDEX_PIP (curled forward)
  [55, 100], // 7 INDEX_DIP
  [52, 106], // 8 INDEX_TIP
  [63, 81],  // 9 MIDDLE_MCP
  [66, 89],  // 10 MIDDLE_PIP
  [64, 99],  // 11 MIDDLE_DIP
  [61, 104], // 12 MIDDLE_TIP
  [72, 84],  // 13 RING_MCP
  [74, 92],  // 14 RING_PIP
  [72, 101], // 15 RING_DIP
  [69, 107], // 16 RING_TIP
  [79, 91],  // 17 PINKY_MCP
  [82, 99],  // 18 PINKY_PIP
  [80, 107], // 19 PINKY_DIP
  [77, 111], // 20 PINKY_TIP
];

export function OpenPalmIcon({ className }: { className?: string }) {
  return <HandSkeleton lm={OPEN_PALM_LM} className={className} />;
}

export function PeaceSignIcon({ className }: { className?: string }) {
  return <HandSkeleton lm={PEACE_SIGN_LM} className={className} />;
}

export function ThumbsUpIcon({ className }: { className?: string }) {
  return <HandSkeleton lm={THUMBS_UP_LM} className={className} />;
}

export function ThumbsDownIcon({ className }: { className?: string }) {
  return <HandSkeleton lm={THUMBS_DOWN_LM} className={className} />;
}
