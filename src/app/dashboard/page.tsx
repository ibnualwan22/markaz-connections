import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { readJson, User, Grants, App, Role, UserRoles } from "@/lib/store";
import { effectiveAppIds } from "@/lib/akses";
import { SSO_TARGETS } from "@/lib/sso-targets";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import HexBackground from "@/lib/HexBackground";
import AppCard from "@/components/AppCard";

export default async function Dashboard() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) redirect("/login?next=/dashboard");

  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === payload.sub && u.aktif);
  if (!user) redirect("/login?next=/dashboard");

  const grants = await readJson<Grants>("grants.json", {});
  const roles = await readJson<Role[]>("roles.json", []);
  const userRoles = await readJson<UserRoles>("user_roles.json", {});
  const apps = await readJson<App[]>("apps.json", []);
  const boleh = new Set(effectiveAppIds(user.id, grants, roles, userRoles));
  const aplikasiSaya = apps.filter((a) => boleh.has(a.id));

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        {/* Aplikasi (kartu user kini di atas sidebar) */}
        <section className="mt-2">
          <h2 className="text-lg font-bold text-slate-800 mb-3">
            Website yang dapat Anda akses{" "}
            <span className="text-slate-400 font-normal">
              ({aplikasiSaya.length})
            </span>
          </h2>
          {aplikasiSaya.length === 0 ? (
            <div className="bg-white/75 backdrop-blur-sm border border-sky-100 rounded-2xl p-8 text-center text-sm text-slate-500">
              Belum ada website yang diberikan akses untuk Anda.
              <br />
              Hubungi superadmin untuk meminta akses.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {aplikasiSaya.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  href={SSO_TARGETS[app.id] ? `/api/sso/${app.id}` : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 text-center text-xs text-blue-400/60 font-medium">
          &copy; {new Date().getFullYear()} Markaz Arabiyah &mdash; Developed by{" "}
          <span className="text-blue-700 font-semibold">Aksara X KSU Batch 10</span>.
        </footer>
      </div>
    </main>
  );
}
