import { NextResponse } from "next/server";
import { readJson, writeJson, UserRoles, Role, User } from "@/lib/store";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";

export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const userRoles = await readJson<UserRoles>("user_roles.json", {});
  return NextResponse.json({ userRoles });
}

export async function POST(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { userId, roleId, assign, roleIds } = await req.json();
  const users = await readJson<User[]>("users.json", []);
  if (!users.some((u) => u.id === userId)) {
    return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
  }
  const roles = await readJson<Role[]>("roles.json", []);
  const sah = new Set(roles.map((r) => r.id));
  const userRoles = await readJson<UserRoles>("user_roles.json", {});
  const sekarang = new Set(userRoles[userId] || []);

  if (Array.isArray(roleIds)) {
    // Ganti seluruh penugasan user dengan daftar ini.
    const bersih = [...new Set(roleIds.map(String))].filter((id) => sah.has(id));
    userRoles[userId] = bersih;
  } else if (roleId && sah.has(roleId)) {
    if (assign === false) sekarang.delete(roleId);
    else sekarang.add(roleId);
    userRoles[userId] = [...sekarang];
  } else {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  await writeJson("user_roles.json", userRoles);
  await appendAudit({
    aktorId: s.user.id,
    aktorUsername: s.user.username,
    aksi: "ubah_user_roles",
    targetId: userId,
    detail: `roles=${(userRoles[userId] || []).join(",")}`,
  });
  return NextResponse.json({ roles: userRoles[userId] || [] });
}
