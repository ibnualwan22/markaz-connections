import { NextResponse } from "next/server";
import { readJson, writeJson, Role, App } from "@/lib/store";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";

async function validasiApps(apps: unknown): Promise<string[] | null> {
  if (!Array.isArray(apps)) return null;
  const daftar = await readJson<App[]>("apps.json", []);
  const sah = new Set(daftar.map((a) => a.id));
  const bersih = [...new Set(apps.map(String))].filter((id) => sah.has(id));
  return bersih;
}

export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const roles = await readJson<Role[]>("roles.json", []);
  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { nama, apps } = await req.json();
  if (!nama || typeof nama !== "string") {
    return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
  }
  const bersih = await validasiApps(apps);
  if (bersih === null) {
    return NextResponse.json({ error: "Daftar website tidak valid" }, { status: 400 });
  }
  const roles = await readJson<Role[]>("roles.json", []);
  const role: Role = {
    id: "r-" + Date.now().toString(36),
    nama: nama.trim(),
    apps: bersih,
  };
  roles.push(role);
  await writeJson("roles.json", roles);
  await appendAudit({
    aktorId: s.user.id,
    aktorUsername: s.user.username,
    aksi: "buat_role",
    targetId: role.id,
    detail: `nama=${role.nama} apps=${role.apps.join(",")}`,
  });
  return NextResponse.json({ role });
}

export async function PATCH(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id, nama, apps } = await req.json();
  const roles = await readJson<Role[]>("roles.json", []);
  const role = roles.find((r) => r.id === id);
  if (!role) return NextResponse.json({ error: "Role tidak ada" }, { status: 404 });
  if (nama !== undefined) role.nama = String(nama).trim();
  if (apps !== undefined) {
    const bersih = await validasiApps(apps);
    if (bersih === null) {
      return NextResponse.json({ error: "Daftar website tidak valid" }, { status: 400 });
    }
    role.apps = bersih;
  }
  await writeJson("roles.json", roles);
  await appendAudit({
    aktorId: s.user.id,
    aktorUsername: s.user.username,
    aksi: "ubah_role",
    targetId: role.id,
    detail: `nama=${role.nama} apps=${role.apps.join(",")}`,
  });
  return NextResponse.json({ role });
}

export async function DELETE(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  const roles = await readJson<Role[]>("roles.json", []);
  const role = roles.find((r) => r.id === id);
  if (!role) return NextResponse.json({ error: "Role tidak ada" }, { status: 404 });
  await writeJson(
    "roles.json",
    roles.filter((r) => r.id !== id)
  );
  // Cabut penugasan role ini dari semua user.
  const userRoles = await readJson<Record<string, string[]>>("user_roles.json", {});
  let berubah = false;
  for (const uid of Object.keys(userRoles)) {
    const sebelum = userRoles[uid].length;
    userRoles[uid] = userRoles[uid].filter((rid) => rid !== id);
    if (userRoles[uid].length !== sebelum) berubah = true;
  }
  if (berubah) await writeJson("user_roles.json", userRoles);
  await appendAudit({
    aktorId: s.user.id,
    aktorUsername: s.user.username,
    aksi: "hapus_role",
    targetId: id || undefined,
    detail: `nama=${role.nama}`,
  });
  return NextResponse.json({ ok: true });
}
