"use client";

import { ExternalLink, Lock } from "lucide-react";
import type { App } from "@/lib/store";

const LOGO_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' rx='12' fill='%23e0f2fe'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%230284c7' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";

// Kartu website — desain asli Markaz Connections
// href opsional: untuk web yang SSO-nya sudah jadi, tile mengarah ke route
// penerbit token Bawwabah (bukan langsung ke URL web).
export default function AppCard({ app, href }: { app: App; href?: string }) {
  const comingSoon = !app.url;

  const inner = (
    <div
      className={`
        relative flex flex-col h-full bg-white/75 backdrop-blur-sm rounded-2xl border p-4 overflow-hidden
        transition-all duration-300 group
        ${
          comingSoon
            ? "border-slate-200 opacity-55 grayscale cursor-not-allowed"
            : "border-sky-100 hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-200/60 hover:-translate-y-1.5 cursor-pointer"
        }
      `}
    >
      {!comingSoon && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-700 rounded-t-2xl" />
      )}

      {comingSoon && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-200">
          <Lock size={10} />
          {app.status || "Coming Soon"}
        </span>
      )}

      <div className="w-10 h-10 rounded-xl mb-3 shrink-0 overflow-hidden shadow-sm bg-sky-50 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={app.logo || LOGO_FALLBACK}
          alt={`Logo ${app.nama}`}
          className="w-full h-full object-contain p-1.5"
          onError={(e) => {
            e.currentTarget.src = LOGO_FALLBACK;
          }}
        />
      </div>

      <div className="flex-1">
        <h3
          className={`font-bold leading-snug mb-1 pr-6 text-sm ${
            comingSoon
              ? "text-slate-600"
              : "text-slate-800 group-hover:text-blue-700 transition-colors"
          }`}
        >
          {app.nama}
        </h3>
        <p className="text-[11px] text-slate-400 font-medium truncate">{app.deskripsi}</p>
      </div>

      {!comingSoon && (
        <div className="absolute bottom-4 right-4 text-sky-400 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ExternalLink size={15} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  if (comingSoon) return <div className="h-full">{inner}</div>;

  return (
    <a
      href={href || app.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    >
      {inner}
    </a>
  );
}
