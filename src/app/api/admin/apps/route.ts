import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, writeJson, App, Grants } from "@/lib/store";

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
  const { nama, url, deskripsi, ikon, kategori } = await req.json();
  if (!nama || !url)
    return NextResponse.json(
      { error: "Nama dan URL wajib diisi" },
      { status: 400 }
    );

  const apps = await readJson<App[]>("apps.json", []);
  const app: App = {
    id: "app-" + Date.now().toString(36),
    nama: String(nama),
    url: String(url),
    deskripsi: String(deskripsi || ""),
    ikon: String(ikon || "Globe"),
    kategori: String(kategori || "Lainnya"),
  };
  apps.push(app);
  await writeJson("apps.json", apps);
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
