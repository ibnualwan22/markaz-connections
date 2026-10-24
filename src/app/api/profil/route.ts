import { NextResponse } from "next/server";
import { readJson, writeJson, User } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

const tanpaHash = (u: User) => {
  const { passwordHash: _h, ...rest } = u;
  return rest;
};

// Field yang boleh diubah user untuk dirinya sendiri. Username, peran,
// status aktif, dan is_owner TIDAK boleh diubah dari sini.
const BOLEH_UBAH = [
  "nama",
  "email",
  "alamat",
  "tempat_lahir",
  "tanggal_lahir",
  "pendidikan_terakhir",
  "jabatan",
  "no_wa",
] as const;

export async function GET() {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  return NextResponse.json({ user: tanpaHash(s.user) });
}

export async function PATCH(req: Request) {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const body = await req.json();
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === s.user.id);
  if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
  for (const f of BOLEH_UBAH) {
    if (body[f] !== undefined) user[f] = String(body[f]);
  }
  await writeJson("users.json", users);
  return NextResponse.json({ user: tanpaHash(user) });
}
