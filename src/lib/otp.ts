import { createHash, randomInt, timingSafeEqual } from "crypto";
import { readJson, writeJson, OtpEntry } from "./store";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const OTP_MAKS_PERCOBAAN = 5;

function hashKode(kode: string): string {
  return createHash("sha256").update(kode).digest("hex");
}

function samaHash(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function mintaOtp(
  userId: string
): Promise<
  | { ok: true; kode: string }
  | { ok: false; error: string; sisaCooldownDetik?: number }
> {
  const list = await readJson<OtpEntry[]>("otp.json", []);
  const lama = list.find((o) => o.userId === userId);
  const sekarang = Date.now();
  if (lama && sekarang - lama.permintaanTerakhir < OTP_COOLDOWN_MS) {
    return {
      ok: false,
      error: "Tunggu sebentar sebelum meminta kode lagi.",
      sisaCooldownDetik: Math.ceil(
        (OTP_COOLDOWN_MS - (sekarang - lama.permintaanTerakhir)) / 1000
      ),
    };
  }
  const kode = String(randomInt(0, 1000000)).padStart(6, "0");
  const entry: OtpEntry = {
    userId,
    kodeHash: hashKode(kode),
    dibuatPada: sekarang,
    kedaluwarsaPada: sekarang + OTP_TTL_MS,
    percobaan: 0,
    permintaanTerakhir: sekarang,
  };
  await writeJson(
    "otp.json",
    [...list.filter((o) => o.userId !== userId), entry]
  );
  return { ok: true, kode };
}

export async function verifikasiOtp(
  userId: string,
  kode: string
): Promise<{ ok: boolean; error?: string }> {
  const list = await readJson<OtpEntry[]>("otp.json", []);
  const entry = list.find((o) => o.userId === userId);
  if (!entry) return { ok: false, error: "Kode tidak ditemukan, minta kode baru." };
  if (Date.now() > entry.kedaluwarsaPada) {
    await writeJson(
      "otp.json",
      list.filter((o) => o.userId !== userId)
    );
    return { ok: false, error: "Kode kedaluwarsa, minta kode baru." };
  }
  if (entry.percobaan >= OTP_MAKS_PERCOBAAN) {
    await writeJson(
      "otp.json",
      list.filter((o) => o.userId !== userId)
    );
    return { ok: false, error: "Terlalu banyak percobaan, minta kode baru." };
  }
  if (!samaHash(hashKode(String(kode).trim()), entry.kodeHash)) {
    entry.percobaan += 1;
    await writeJson("otp.json", list);
    return { ok: false, error: "Kode salah." };
  }
  // Sekali pakai: hapus setelah berhasil.
  await writeJson(
    "otp.json",
    list.filter((o) => o.userId !== userId)
  );
  return { ok: true };
}

export async function hapusOtp(userId: string): Promise<void> {
  const list = await readJson<OtpEntry[]>("otp.json", []);
  await writeJson(
    "otp.json",
    list.filter((o) => o.userId !== userId)
  );
}
