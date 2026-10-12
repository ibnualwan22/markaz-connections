import Link from "next/link";
import { cookies } from "next/headers";
import { LayoutGrid, LogIn, ArrowRight } from "lucide-react";
import { readJson, App } from "@/lib/store";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { Ikon } from "@/lib/ikon";

export default async function Beranda() {
  const apps = await readJson<App[]>("apps.json", []);
  const token = cookies().get(COOKIE_NAME)?.value;
  const sesi = token ? await verifyToken(token) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Bawwabah</div>
              <div className="text-xs text-stone-500 leading-tight">
                Gerbang Ekosistem Digital Markaz Arabiyah
              </div>
            </div>
          </div>
          {sesi ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-800"
            >
              Dasbor Saya <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-800"
            >
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900">
            Satu Gerbang untuk Seluruh Layanan Digital
          </h1>
          <p className="mt-3 text-stone-600 max-w-2xl mx-auto">
            Bawwabah adalah pintu masuk utama ekosistem website Markaz
            Arabiyah. Masuk sekali, kelola akses, dan buka layanan yang Anda
            butuhkan — semua dari satu tempat.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-lg font-semibold mb-4">
            Website Markaz Arabiyah{" "}
            <span className="text-stone-400 font-normal">({apps.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Ikon nama={app.ikon} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold group-hover:text-emerald-700">
                      {app.nama}
                    </div>
                    <div className="text-xs text-stone-500">{app.kategori}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-stone-600 line-clamp-2">
                  {app.deskripsi}
                </p>
              </a>
            ))}
          </div>
          {apps.length === 0 && (
            <p className="text-stone-500 text-sm">
              Belum ada website terdaftar.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-stone-200 py-4">
        <p className="text-center text-xs text-stone-500">
          Bawwabah &mdash; Markaz Arabiyah &bull; Kelola akses terpusat, satu
          akun untuk semua layanan
        </p>
      </footer>
    </div>
  );
}
