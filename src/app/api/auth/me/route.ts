import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, User, Grants, App, Role, UserRoles } from "@/lib/store";
import { effectiveAppIds } from "@/lib/akses";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ user: null });

  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === payload.sub && u.aktif);
  if (!user) return NextResponse.json({ user: null });

  const grants = await readJson<Grants>("grants.json", {});
  const roles = await readJson<Role[]>("roles.json", []);
  const userRoles = await readJson<UserRoles>("user_roles.json", {});
  const apps = await readJson<App[]>("apps.json", []);
  const boleh = new Set(effectiveAppIds(user.id, grants, roles, userRoles));
  const { passwordHash: _h, ...aman } = user;

  return NextResponse.json({
    user: aman,
    apps: apps.filter((a) => boleh.has(a.id)),
  });
}
