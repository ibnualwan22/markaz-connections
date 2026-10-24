import { NextResponse } from "next/server";
import { readJson, writeJson, User } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { checkPassword, hashPassword } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";

// Jalur darurat bila OTP WA belum bisa dipakai (mis. VM private mati):
// ganti password dengan verifikasi password lama.
export async function POST(req: Request) {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const { passwordLama, passwordBaru } = await req.json();
  if (!passwordLama || !passwordBaru || String(passwordBaru).length < 6) {
    return NextResponse.json(
      { error: "Password lama dan password baru (min 6 karakter) wajib diisi" },
      { status: 400 }
    );
  }
  const cocok = await checkPassword(String(passwordLama), s.user.passwordHash);
  if (!cocok) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
  }
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === s.user.id);
  if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
  user.passwordHash = await hashPassword(String(passwordBaru));
  await writeJson("users.json", users);
  await appendAudit({
    aktorId: user.id,
    aktorUsername: user.username,
    aksi: "ubah_password_lama",
    targetId: user.id,
  });
  return NextResponse.json({ ok: true });
}
