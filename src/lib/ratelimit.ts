// Rate limit sederhana di memori (satu container = satu proses, cukup untuk
// Fase 1; reset saat container restart — dicatat, bukan disembunyikan).
// Dipakai untuk login: maks 5 gagal per 5 menit per kombinasi IP+username.
const gagal = new Map<string, { hitung: number; pertama: number }>();

const JANDELA_MS = 5 * 60 * 1000;
const MAKS_GAGAL = 5;

export function loginDibatasi(kunci: string): boolean {
  const entri = gagal.get(kunci);
  if (!entri) return false;
  if (Date.now() - entri.pertama > JANDELA_MS) {
    gagal.delete(kunci);
    return false;
  }
  return entri.hitung >= MAKS_GAGAL;
}

export function catatLoginGagal(kunci: string): void {
  const entri = gagal.get(kunci);
  const sekarang = Date.now();
  if (!entri || sekarang - entri.pertama > JANDELA_MS) {
    gagal.set(kunci, { hitung: 1, pertama: sekarang });
  } else {
    entri.hitung += 1;
  }
}

export function hapusLoginGagal(kunci: string): void {
  gagal.delete(kunci);
}
