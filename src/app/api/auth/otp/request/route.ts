import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { mintaOtp, hapusOtp } from "@/lib/otp";
import { kirimOtpWa } from "@/lib/wa";

export async function POST() {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const noWa = (s.user.no_wa || "").trim();
  if (!noWa) {
    return NextResponse.json(
      { error: "Nomor WA belum diisi, lengkapi profil dulu." },
      { status: 400 }
    );
  }
  const hasil = await mintaOtp(s.user.id);
  if (!hasil.ok) {
    return NextResponse.json(
      { error: hasil.error },
      { status: hasil.sisaCooldownDetik ? 429 : 400 }
    );
  }
  // Kode TIDAK PERNAH dikembalikan ke client / ditulis ke log.
  const kirim = await kirimOtpWa(noWa, hasil.kode);
  if (!kirim.ok) {
    // Jangan biarkan kode valid yang tidak pernah diterima user.
    await hapusOtp(s.user.id);
    return NextResponse.json(
      { error: `Gagal mengirim OTP: ${kirim.error}. Coba lagi atau hubungi superadmin.` },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
