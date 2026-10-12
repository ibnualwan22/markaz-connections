import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LayoutGrid, ShieldCheck, ExternalLink } from "lucide-react";
import { readJson, User, Grants, App } from "@/lib/store";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { Ikon } from "@/lib/ikon";
import TombolKeluar from "./TombolKeluar";

export default async function Dashboard() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) redirect("/login?next=/dashboard");

  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === payload.sub && u.aktif);
  if (!user) redirect("/login?next=/dashboard");

  const grants = await readJson<Grants>("grants.json", {});
  const apps = await readJson<App[]>("apps.json", []);
  const boleh = new Set(grants[user.id] || []);
  const aplikasiSaya = apps.filter((a) => boleh.has(a.id));

  const inisial = user.nama
    .split(" ")
    .map((k) => k[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div className="font-bold text-lg">Bawwabah</div>
          </Link>
          <div className="flex items-center gap-2">
            {user.peran === "superadmin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-stone-600 hover:text-emerald-700 px-3 py-2"
              >
                Admin
              </Link>
            )}
            <TombolKeluar />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <section className="bg-white border border-stone-200 rounded-2xl p-6 flex items-center gap-5">
          {user.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.foto}
              alt={user.nama}
              className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-700 text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {inisial}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{user.nama}</h1>
            <p className="text-sm text-stone-500">
              @{user.username}
              {user.email ? ` • ${user.email}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1">
                <ShieldCheck size={13} />
                {user.peran === "superadmin"
                  ? "Superadmin"
                  : user.peran === "admin"
                    ? "Admin"
                    : "Staff"}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Website yang dapat Anda akses{" "}
            <span className="text-stone-400 font-normal">
              ({aplikasiSaya.length})
            </span>
          </h2>
          {aplikasiSaya.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">
              Belum ada website yang diberikan akses untuk Anda.
              <br />
              Hubungi superadmin untuk meminta akses.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aplikasiSaya.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Ikon nama={app.ikon} className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold group-hover:text-emerald-700">
                          {app.nama}
                        </div>
                        <div className="text-xs text-stone-500">
                          {app.kategori}
                        </div>
                      </div>
                    </div>
                    <ExternalLink
                      size={16}
                      className="text-stone-300 group-hover:text-emerald-600 shrink-0 mt-1"
                    />
                  </div>
                  <p className="mt-3 text-sm text-stone-600 line-clamp-2">
                    {app.deskripsi}
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
