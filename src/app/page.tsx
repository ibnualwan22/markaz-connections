import Link from "next/link";
import { cookies } from "next/headers";
import { LogIn, LayoutDashboard } from "lucide-react";
import { readJson, App } from "@/lib/store";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import HexBackground from "@/lib/HexBackground";
import AppCard from "@/components/AppCard";

export default async function Home() {
  const apps = await readJson<App[]>("apps.json", []);
  const token = cookies().get(COOKIE_NAME)?.value;
  const sesi = token ? await verifyToken(token) : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />

      {/* Tombol login melayang */}
      <div className="absolute top-5 right-5 z-20">
        {sesi ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-800 transition"
          >
            <LayoutDashboard size={16} /> Dasbor Saya
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-800 transition"
          >
            <LogIn size={16} /> Login
          </Link>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="text-center max-w-2xl w-full mb-12">
          <div className="mx-auto mb-7 w-70 h-70 drop-shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/markaz-connection.png"
              alt="Bawwabah Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-4">
            Bawwabah
          </h1>

          <p className="text-base sm:text-lg text-blue-800/70 font-medium leading-relaxed mb-4">
            Pusat ekosistem website digital milik{" "}
            <span className="text-blue-700 font-semibold">Markaz Arabiyah</span>.
            <br className="hidden sm:block" />
            Semua layanan, sistem akademik, dan platform digital tersedia dalam
            satu portal terpadu.
          </p>
        </header>

        {/* ── Grid ── */}
        <section className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </section>

        {/* ── Footer ── */}
        <footer className="mt-16 text-center text-xs text-blue-400/60 font-medium">
          &copy; {new Date().getFullYear()} Markaz Arabiyah &mdash; Developed by{" "}
          <span className="text-blue-700 font-semibold">Aksara X KSU Batch 10</span>.
        </footer>
      </div>
    </main>
  );
}
