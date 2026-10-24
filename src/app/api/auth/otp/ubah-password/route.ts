import { NextResponse } from "next/server";
import { readJson, writeJson, User } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { verifikasiOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const { otp, passwordBaru } = await req.json();
  if (!otp || !passwordBaru || String(passwordBaru).length < 6) {
    return NextResponse.json(
      { error: "Kode OTP dan password baru (min 6 karakter) wajib diisi" },
      { status: 400 }
    );
  }
  const cek = await verifikasiOtp(s.user.id, String(otp));
  if (!cek.ok) return NextResponse.json({ error: cek.error }, { status: 400 });
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === s.user.id);
  if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
  user.passwordHash = await hashPassword(String(passwordBaru));
  await writeJson("users.json", users);
  await appendAudit({
    aktorId: user.id,
    aktorUsername: user.username,
    aksi: "ubah_password_otp",
    targetId: user.id,
  });
  return NextResponse.json({ ok: true });
}
