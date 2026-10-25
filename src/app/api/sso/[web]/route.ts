import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readJson, Grants, Role, UserRoles } from "@/lib/store";
import { effectiveAppIds } from "@/lib/akses";
import { SSO_TARGETS } from "@/lib/sso-targets";
import { createSsoToken } from "@/lib/sso";

function errorPage(judul: string, pesan: string) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bawwabah</title></head><body style="font-family:system-ui,sans-serif;background:#F3F4F6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:24px;max-width:420px"><h2 style="color:#B91C1C;margin:0 0 8px">${judul}</h2><p style="color:#374151;font-size:14px;line-height:1.6;margin:0">${pesan}</p><p style="margin:16px 0 0"><a href="/dashboard">Kembali ke dashboard</a></p></div></body></html>`,
    {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(
  req: Request,
  { params }: { params: { web: string } }
) {
  const s = await getSessionUser();
  if (!s)
    return errorPage(
      "Belum login",
      "Silakan login dulu di Bawwabah, lalu klik tile lagi."
    );

  const target = SSO_TARGETS[params.web];
  if (!target)
    return errorPage(
      "SSO belum tersedia",
      "Web ini belum mendukung login otomatis dari Bawwabah. Silakan login langsung di web tersebut."
    );

  const grants = await readJson<Grants>("grants.json", {});
  const roles = await readJson<Role[]>("roles.json", []);
  const userRoles = await readJson<UserRoles>("user_roles.json", {});
  const boleh = effectiveAppIds(s.user.id, grants, roles, userRoles);
  if (!boleh.includes(params.web))
    return errorPage(
      "Akses ditolak",
      "Akun Anda tidak memiliki akses ke web ini."
    );

  // Target username (PPDB) memetakan lewat username, bukan siakadId.
  // Target lain (Siakad) tetap wajib siakadId seperti semula.
  if (target.username) {
    if (!s.user.username)
      return errorPage(
        "Akun belum tertaut",
        "Akun Bawwabah Anda tidak memiliki username. Hubungi super admin."
      );
  } else if (!s.user.siakadId) {
    return errorPage(
      "Akun belum tertaut",
      "Akun Bawwabah Anda belum tertaut ke akun Siakad. Hubungi super admin."
    );
  }

  const secret = process.env[target.secretEnv];
  if (!secret)
    return errorPage(
      "SSO belum dikonfigurasi",
      "Secret SSO belum dipasang di server Bawwabah. Hubungi admin."
    );

  // Target e-maliyah: super admin Bawwabah ditandai klaim superadmin
  // (verifier E-Maliyah memberi sesi admin; target lain mengabaikan
  // klaim ekstra ini).
  let extra: { username?: string; superadmin?: boolean } | undefined;
  if (target.username) extra = { username: s.user.username };
  else if (params.web === "e-maliyah" && s.user.peran === "superadmin")
    extra = { superadmin: true };

  const token = createSsoToken(
    s.user.siakadId || "",
    target.aud,
    secret,
    extra
  );
  return NextResponse.redirect(`${target.url}?token=${token}`);
}
