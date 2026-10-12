import { NextResponse } from "next/server";
import { readJson, User } from "@/lib/store";
import { signToken, checkPassword, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi" },
      { status: 400 }
    );
  }

  const users = await readJson<User[]>("users.json", []);
  const user = users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );

  if (!user || !user.aktif) {
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 }
    );
  }

  const cocok = await checkPassword(String(password), user.passwordHash);
  if (!cocok) {
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 }
    );
  }

  const token = await signToken({
    sub: user.id,
    username: user.username,
    nama: user.nama,
    peran: user.peran,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 3600,
  });
  return res;
}
