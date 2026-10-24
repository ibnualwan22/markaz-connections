import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, writeJson, App, Grants } from "@/lib/store";
import { appendAudit } from "@/lib/audit";

async function superadmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.peran === "superadmin" ? p : null;
}

export async function GET() {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const apps = await readJson<App[]>("apps.json", []);
  return NextResponse.json({ apps });
}

export async function POST(req: Request) {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { nama, url, deskripsi, logo, ikon, kategori } = await req.json();
  if (!nama)
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });

  const apps = await readJson<App[]>("apps.json", []);
  const app: App = {
    id: "app-" + Date.now().toString(36),
    nama: String(nama),
    url: String(url || ""),
    logo: String(logo || ""),
    deskripsi: String(deskripsi || ""),
    ikon: String(ikon || "Globe"),
    kategori: String(kategori || "Lainnya"),
  };
  apps.push(app);
  await writeJson("apps.json", apps);
  return NextResponse.json({ app });
}

export async function PATCH(req: Request) {
  const p = await superadmin();
  if (!p)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id, nama, url, deskripsi, logo, ikon, kategori, status } =
    await req.json();
  if (!id || !nama)
    return NextResponse.json(
      { error: "ID dan nama wajib diisi" },
      { status: 400 }
    );

  const apps = await readJson<App[]>("apps.json", []);
  const app = apps.find((a) => a.id === id);
  if (!app)
    return NextResponse.json(
      { error: "Website tidak ditemukan" },
      { status: 404 }
    );

  const urlLama = app.url;
  app.nama = String(nama);
  app.url = String(url || "");
  app.deskripsi = String(deskripsi || "");
  app.logo = String(logo || "");
  app.ikon = String(ikon || "Globe");
  app.kategori = String(kategori || "Lainnya");
  if (status !== undefined) app.status = String(status);
  await writeJson("apps.json", apps);
  await appendAudit({
    aktorId: p.sub,
    aktorUsername: p.username,
    aksi: "edit_app",
    targetId: id,
    detail: `URL ${urlLama || "(kosong)"} -> ${app.url || "(kosong)"}`,
  });
  return NextResponse.json({ app });
}

export async function DELETE(req: Request) {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const apps = (await readJson<App[]>("apps.json", [])).filter((a) => a.id !== id);
  await writeJson("apps.json", apps);
  const grants = await readJson<Grants>("grants.json", {});
  for (const uid of Object.keys(grants))
    grants[uid] = grants[uid].filter((x) => x !== id);
  await writeJson("grants.json", grants);
  return NextResponse.json({ ok: true });
}
