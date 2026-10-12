import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME, hashPassword } from "@/lib/auth";
import { readJson, writeJson, User } from "@/lib/store";

async function superadmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.peran === "superadmin" ? p : null;
}

const tanpaHash = (u: User) => {
  const { passwordHash: _h, ...rest } = u;
  return rest;
};

export async function GET() {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const users = await readJson<User[]>("users.json", []);
  return NextResponse.json({ users: users.map(tanpaHash) });
}

export async function POST(req: Request) {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { username, nama, password, peran } = await req.json();
  if (!username || !nama || !password)
    return NextResponse.json(
      { error: "Username, nama, dan password wajib diisi" },
      { status: 400 }
    );

  const users = await readJson<User[]>("users.json", []);
  if (
    users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())
  )
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });

  const user: User = {
    id: "u-" + Date.now().toString(36),
    username: String(username).toLowerCase(),
    nama: String(nama),
    email: "",
    foto: "",
    peran: peran === "superadmin" || peran === "admin" ? peran : "staff",
    tipe: "staff",
    aktif: true,
    passwordHash: await hashPassword(String(password)),
  };
  users.push(user);
  await writeJson("users.json", users);
  return NextResponse.json({ user: tanpaHash(user) });
}

export async function PATCH(req: Request) {
  if (!(await superadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id, aktif, password } = await req.json();
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === id);
  if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });

  if (typeof aktif === "boolean") user.aktif = aktif;
  if (password) user.passwordHash = await hashPassword(String(password));

  await writeJson("users.json", users);
  return NextResponse.json({ user: tanpaHash(user) });
}
