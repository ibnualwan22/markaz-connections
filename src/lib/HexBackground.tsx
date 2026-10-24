// Pola hexagon biru — background khas desain asli Markaz Connections
export default function HexBackground() {
  const s = 40;
  const w = s * Math.sqrt(3);
  const h = s * 2;
  const patW = w;
  const patH = h * 1.5;

  const hex = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return pts.join(" ");
  };

  const STROKE = "#1d4ed8";
  const OPACITY = 0.09;

  const diamond = (mx: number, my: number, keyPrefix: string) =>
    [0, 2, 4].map((i) => {
      const a1 = (Math.PI / 180) * (60 * i - 30);
      const r1 = (s - 1) * 0.52;
      const r2 = s - 1;
      return (
        <line
          key={`${keyPrefix}${i}`}
          x1={mx + r1 * Math.cos(a1)}
          y1={my + r1 * Math.sin(a1)}
          x2={mx + r2 * Math.cos(a1)}
          y2={my + r2 * Math.sin(a1)}
          stroke={STROKE}
          strokeWidth="0.8"
          opacity={OPACITY}
        />
      );
    });

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hexPat"
          x="0"
          y="0"
          width={patW}
          height={patH}
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points={hex(patW / 2, s, s - 1)}
            fill="none"
            stroke={STROKE}
            strokeWidth="1"
            opacity={OPACITY}
          />
          <polygon
            points={hex(patW / 2, s, (s - 1) * 0.52)}
            fill="none"
            stroke={STROKE}
            strokeWidth="0.7"
            opacity={OPACITY * 0.9}
          />
          {diamond(patW / 2, s, "a")}
          <polygon
            points={hex(0, h, s - 1)}
            fill="none"
            stroke={STROKE}
            strokeWidth="1"
            opacity={OPACITY}
          />
          <polygon
            points={hex(0, h, (s - 1) * 0.52)}
            fill="none"
            stroke={STROKE}
            strokeWidth="0.7"
            opacity={OPACITY * 0.9}
          />
          {diamond(0, h, "b")}
          <polygon
            points={hex(patW, h, s - 1)}
            fill="none"
            stroke={STROKE}
            strokeWidth="1"
            opacity={OPACITY}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexPat)" />
    </svg>
  );
}
