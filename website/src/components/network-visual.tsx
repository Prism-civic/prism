const nodes = [
  { x: 20, y: 50, r: 4, type: "country" },
  { x: 30, y: 38, r: 5, type: "world" },
  { x: 34, y: 62, r: 3, type: "edge" },
  { x: 44, y: 30, r: 4, type: "country" },
  { x: 48, y: 50, r: 7, type: "world" },
  { x: 52, y: 72, r: 3, type: "edge" },
  { x: 61, y: 35, r: 4, type: "country" },
  { x: 70, y: 50, r: 5, type: "world" },
  { x: 75, y: 65, r: 4, type: "country" },
  { x: 81, y: 43, r: 3, type: "edge" },
];

const links = [
  [20, 50, 30, 38],
  [30, 38, 48, 50],
  [20, 50, 34, 62],
  [34, 62, 48, 50],
  [44, 30, 48, 50],
  [48, 50, 61, 35],
  [48, 50, 52, 72],
  [48, 50, 70, 50],
  [70, 50, 75, 65],
  [70, 50, 81, 43],
  [61, 35, 81, 43],
];

function nodeClass(type: string) {
  if (type === "world") {
    return "world";
  }

  if (type === "country") {
    return "country";
  }

  return "edge";
}

export function NetworkVisual() {
  return (
    <figure className="section-card network-shell relative overflow-hidden rounded-[2rem] px-4 py-4 sm:px-6 sm:py-6">
      <div className="network-grid pointer-events-none absolute inset-0 opacity-45" />
      <div className="network-orbit pointer-events-none absolute inset-[10%] rounded-full border border-white/10" />
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby="network-title network-desc"
        className="relative z-10 aspect-[1.15] w-full"
      >
        <title id="network-title">Abstract Prism network view</title>
        <desc id="network-desc">
          Ten connected nodes pulse across an abstract network. Three brighter nodes represent world minds, four amber nodes represent country minds, and the remaining edge nodes show local device activity.
        </desc>

        <defs>
          <radialGradient id="glow-world" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#e0f2fe" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-country" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-edge" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#f0f4ff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#94a3b8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {links.map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}-${x2}-${y2}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="network-beam"
            stroke="rgba(224, 242, 254, 0.32)"
            strokeWidth="0.55"
            strokeLinecap="round"
          />
        ))}

        {nodes.map((node) => (
          <g
            key={`${node.x}-${node.y}`}
            className={`network-node ${nodeClass(node.type)}`}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r * 2.8}
              fill={
                node.type === "world"
                  ? "url(#glow-world)"
                  : node.type === "country"
                    ? "url(#glow-country)"
                    : "url(#glow-edge)"
              }
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={
                node.type === "world"
                  ? "#e0f2fe"
                  : node.type === "country"
                    ? "#f59e0b"
                    : "#cbd5e1"
              }
            />
          </g>
        ))}
      </svg>
      <figcaption className="relative z-10 mt-4 flex flex-col gap-2 rounded-[1.4rem] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-7 text-muted">
        <span className="font-medium text-foreground">Accessible text alternative</span>
        <span>
          The visual is an abstract network placeholder for Phase 1. It signals network activity without claiming that the full live globe already exists.
        </span>
      </figcaption>
    </figure>
  );
}
