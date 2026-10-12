import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, writeJson, Grants } from "@/lib/store";

async function superadmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.peran === "superadmin" ? p : null;
}

export async function GET() {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const grants = await readJson<Grants>("grants.json", {});
  return NextResponse.json({ grants });
}

export async function POST(req: Request) {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { userId, appId, allow } = await req.json();
  if (!userId || !appId)
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const grants = await readJson<Grants>("grants.json", {});
  const daftar = new Set(grants[userId] || []);
  if (allow) daftar.add(appId);
  else daftar.delete(appId);
  grants[userId] = [...daftar];
  await writeJson("grants.json", grants);
  return NextResponse.json({ ok: true });
}
