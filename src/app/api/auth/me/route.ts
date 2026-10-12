import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, User, Grants, App } from "@/lib/store";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ user: null });

  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === payload.sub && u.aktif);
  if (!user) return NextResponse.json({ user: null });

  const grants = await readJson<Grants>("grants.json", {});
  const apps = await readJson<App[]>("apps.json", []);
  const boleh = new Set(grants[user.id] || []);
  const { passwordHash: _h, ...aman } = user;

  return NextResponse.json({
    user: aman,
    apps: apps.filter((a) => boleh.has(a.id)),
  });
}
