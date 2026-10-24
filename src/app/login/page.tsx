"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import HexBackground from "@/lib/HexBackground";

const LOGOS = [
  "/images/logo-ppdb-ma.png",
  "/images/logo-ppdb-mt.png",
  "/images/logo-siakad-ma.png",
  "/images/logo-siakad-mt.png",
  "/images/logo-emaliyah.png",
  "/images/logo-etalim.png",
  "/images/logo-mediator.png",
];

// Strip logo berjalan ke kiri, looping tanpa henti
function LogoMarquee() {
  const ganda = [...LOGOS, ...LOGOS];
  return (
    <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max items-center gap-10 animate-marquee">
        {ganda.map((src, i) => (
          <div
            key={i}
            className="w-16 h-16 shrink-0 rounded-2xl bg-white/80 border border-sky-100 shadow-sm flex items-center justify-center p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSibuk(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server");
    } finally {
      setSibuk(false);
    }
  }

  const input =
    "mt-1 w-full border border-sky-200 rounded-xl px-3 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-400";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100 flex flex-col">
      <HexBackground />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-24 h-24 mb-5 drop-shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/markaz-connection.png"
            alt="Bawwabah"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-1">
          Bawwabah
        </h1>
        <p className="text-sm text-blue-800/60 font-medium mb-7">
          Masuk ke gerbang ekosistem digital
        </p>

        <div className="w-full max-w-sm bg-white/75 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-xl shadow-sky-200/40">
          <form onSubmit={masuk} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input
                className={input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={lihat ? "text" : "password"}
                  className="w-full border border-sky-200 rounded-xl px-3 py-2.5 text-sm bg-white/80 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setLihat(!lihat)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sibuk}
              className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white font-semibold py-2.5 rounded-xl hover:from-blue-800 hover:to-sky-600 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition"
            >
              {sibuk ? "Memeriksa..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-xs text-blue-400/70 mt-4">
          <Link href="/" className="hover:text-blue-700 font-medium">
            &larr; Kembali ke beranda
          </Link>
        </p>
      </div>

      {/* Marquee logo */}
      <div className="relative z-10 pb-8 pt-2">
        <p className="text-center text-xs font-semibold text-blue-400/70 mb-3 tracking-wide">
          EKOSISTEM DIGITAL MARKAZ ARABIYAH
        </p>
        <LogoMarquee />
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
          Memuat...
        </div>
      }
    >
      <FormLogin />
    </Suspense>
  );
}
