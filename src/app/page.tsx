"use client";

import { ExternalLink, Lock } from "lucide-react";

type EcosystemItem = {
  name: string;
  description: string;
  url: string | null;
  status?: string;
  logo: string;
};

const ecosystemData: EcosystemItem[] = [
  {
    name: "PPDB Markaz Arabiyah",
    description: "Penerimaan Peserta Didik Baru",
    url: "https://ppdb.markazarabiyah.site",
    logo: "/images/logo-ppdb-ma.png",
  },
  {
    name: "PPDB Markaz Turats",
    description: "Penerimaan Peserta Didik Baru",
    url: "https://ppdb.markazarabiyah.site",
    logo: "/images/logo-ppdb-mt.png",
  },
  {
    name: "Siakad Markaz Arabiyah",
    description: "Sistem Informasi Akademik",
    url: "https://siakad.markazarabiyah.site",
    logo: "/images/logo-siakad-ma.png",
  },
  {
    name: "Siakad Markaz Turats",
    description: "Sistem Informasi Akademik",
    url: "https://siakad.markazarabiyah.site",
    logo: "/images/logo-siakad-mt.png",
  },
  {
    name: "E-Maliyah",
    description: "Manajemen Keuangan",
    url: "https://e-maliyah.markazarabiyah.site",
    logo: "/images/logo-emaliyah.png",
  },
  {
    name: "E-Ta'lim",
    description: "Markaz Online",
    url: null,
    status: "Coming Soon",
    logo: "/images/logo-etalim.png",
  },
  {
    name: "Markaz Mediator",
    description: "Layanan Mediasi",
    url: null,
    status: "Coming Soon",
    logo: "/images/logo-mediator.png",
  },
];

// ── Hexagonal tiling pattern (blue theme) ──────────────────────────────────
function HexBackground() {
  // One hexagon "cube" unit path offset logic:
  // We tile a 3D-cube / hexagon pattern like the reference image.
  const s = 40; // side length of each hexagon unit
  const w = s * Math.sqrt(3);
  const h = s * 2;
  const patW = w;
  const patH = h * 1.5;

  // Flat-top hexagon points helper
  const hex = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return pts.join(" ");
  };

  const STROKE = "#1d4ed8";
  const OPACITY = 0.09;

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
          {/* outer hex */}
          <polygon
            points={hex(patW / 2, s, s - 1)}
            fill="none"
            stroke={STROKE}
            strokeWidth="1"
            opacity={OPACITY}
          />
          {/* inner hex (rotated 30° to create 3D cube look) */}
          <polygon
            points={hex(patW / 2, s, (s - 1) * 0.52)}
            fill="none"
            stroke={STROKE}
            strokeWidth="0.7"
            opacity={OPACITY * 0.9}
          />
          {/* 3 diamond / rhombus lines from center = cube illusion */}
          {[0, 2, 4].map((i) => {
            const a1 = (Math.PI / 180) * (60 * i - 30);
            const a2 = (Math.PI / 180) * (60 * (i + 1) - 30);
            const r1 = (s - 1) * 0.52;
            const r2 = s - 1;
            const mx = patW / 2;
            const my = s;
            return (
              <line
                key={i}
                x1={mx + r1 * Math.cos(a1)}
                y1={my + r1 * Math.sin(a1)}
                x2={mx + r2 * Math.cos(a1)}
                y2={my + r2 * Math.sin(a1)}
                stroke={STROKE}
                strokeWidth="0.8"
                opacity={OPACITY}
              />
            );
          })}
          {/* second row offset */}
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
          {[0, 2, 4].map((i) => {
            const a1 = (Math.PI / 180) * (60 * i - 30);
            const r1 = (s - 1) * 0.52;
            const r2 = s - 1;
            const mx = 0;
            const my = h;
            return (
              <line
                key={`b${i}`}
                x1={mx + r1 * Math.cos(a1)}
                y1={my + r1 * Math.sin(a1)}
                x2={mx + r2 * Math.cos(a1)}
                y2={my + r2 * Math.sin(a1)}
                stroke={STROKE}
                strokeWidth="0.8"
                opacity={OPACITY}
              />
            );
          })}
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

// ── Single Card ────────────────────────────────────────────────────────────
function AppCard({ item }: { item: EcosystemItem }) {
  const isComingSoon = item.url === null;

  const inner = (
    <div
      className={`
        relative flex flex-col h-full bg-white/75 backdrop-blur-sm rounded-2xl border p-6 overflow-hidden
        transition-all duration-300 group
        ${isComingSoon
          ? "border-slate-200 opacity-55 grayscale cursor-not-allowed"
          : "border-sky-100 hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-200/60 hover:-translate-y-1.5 cursor-pointer"
        }
      `}
    >
      {!isComingSoon && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-700 rounded-t-2xl" />
      )}

      {isComingSoon && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-200">
          <Lock size={10} />
          {item.status}
        </span>
      )}

      <div className="w-14 h-14 rounded-xl mb-5 shrink-0 overflow-hidden shadow-sm bg-sky-50 flex items-center justify-center">
        <img
          src={item.logo}
          alt={`Logo ${item.name}`}
          className="w-full h-full object-contain p-1.5"
          onError={(e) => {
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' rx='12' fill='%23e0f2fe'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%230284c7' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      <div className="flex-1">
        <h3
          className={`font-bold leading-snug mb-1 pr-6 text-base ${isComingSoon
            ? "text-slate-600"
            : "text-slate-800 group-hover:text-blue-700 transition-colors"
            }`}
        >
          {item.name}
        </h3>
        <p className="text-xs text-slate-400 font-medium">{item.description}</p>
      </div>

      {!isComingSoon && (
        <div className="absolute bottom-5 right-5 text-sky-400 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ExternalLink size={17} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  if (isComingSoon) return <div className="h-full">{inner}</div>;

  return (
    <a
      href={item.url!}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    >
      {inner}
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />

      <div className="relative z-10 flex flex-col items-center px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="text-center max-w-2xl w-full mb-12">
          {/* Logo — bigger */}
          <div className="mx-auto mb-7 w-70 h-70 drop-shadow-xl">
            <img
              src="/images/markaz-connection.png"
              alt="Markaz Connections Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-4">
            Markaz Connections
          </h1>

          {/* Informative subtitle */}
          <p className="text-base sm:text-lg text-blue-800/70 font-medium leading-relaxed mb-4">
            Pusat ekosistem website digital milik{" "}
            <span className="text-blue-700 font-semibold">Markaz Arabiyah</span>.
            <br className="hidden sm:block" />
            Semua layanan, sistem akademik, dan platform digital tersedia dalam satu portal terpadu.
          </p>
        </header>

        {/* ── Grid ── */}
        <section className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {ecosystemData.map((item, i) => (
            <AppCard key={i} item={item} />
          ))}
        </section>

        {/* ── Footer ── */}
        <footer className="mt-16 text-center text-xs text-blue-400/60 font-medium">
          &copy; {new Date().getFullYear()} Markaz Arabiyah &mdash; Developed by <span className="text-blue-700 font-semibold">Aksara X KSU Batch 10</span>.
        </footer>
      </div>
    </main>
  );
}
