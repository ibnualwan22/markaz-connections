// Propagasi periode — Fase 7 Bawwabah.
//
// Bawwabah adalah orkestrator, BUKAN eksekutor: logika destruktif tetap
// milik tiap web (rollover di PPDB, sync di Siakad, mapping di E-Maliyah).
// File ini hanya memanggil endpoint mereka + membaca kembali keadaan
// mereka untuk verifikasi. Semua pemanggilan best-effort: gagalnya satu
// langkah TIDAK pernah membatalkan aktivasi lokal di Bawwabah (yang sudah
// terkomit), tapi selalu dicatat di audit + dikembalikan ke pemanggil
// supaya UI bisa menampilkan status dan tombol coba lagi.
//
// URL:
//   PPDB_URL      (env) atau https://ppdb.markazarabiyah.site
//   SIAKAD_URL    (env) atau https://siakad.markazarabiyah.site
//   EMALIYAH_URL  (env) atau https://e-maliyah.markazarabiyah.site
// Kunci: env BAWABAH_API_KEY — header `x-bawwabah-key` (PPDB/Siakad),
// header `x-webhook-secret` (E-Maliyah, mengikuti pola webhook-nya).
import { getPool, insertAuditLog, simpanPpdbDufahId, type Period } from "./periods";
import { appendAudit } from "./audit";

const PPDB_URL = process.env.PPDB_URL || "https://ppdb.markazarabiyah.site";
const SIAKAD_URL = process.env.SIAKAD_URL || "https://siakad.markazarabiyah.site";
const EMALIYAH_URL =
  process.env.EMALIYAH_URL || "https://e-maliyah.markazarabiyah.site";

export interface Aktor {
  id: string;
  username: string;
}

export interface LangkahHasil {
  ok: boolean;
  error?: string;
  [k: string]: unknown;
}

export interface HasilPropagasi {
  /** Id baris Dufah di PPDB (dari ppdbDufahId tersimpan, atau fallback cari nama). */
  ppdbDufahId: number | null;
  /** Hasil panggilan rollover PPDB (null bila tidak dipanggil). */
  rollover: (LangkahHasil & { sudahDilakukan?: boolean }) | null;
  /** Verifikasi sesudah rollover. */
  verifikasi: {
    ppdbAktif: string | null;
    siakadAktif: string | null;
    siakadJumlah: number | null;
    siakadLastSync: string | null;
  };
  /** Hasil sync tanggal Usbu ke Siakad (null bila Usbu belum lengkap). */
  usbu: LangkahHasil | null;
  /** Hasil pengumuman ke E-Maliyah (null bila Usbu belum lengkap). */
  emaliyah: LangkahHasil | null;
}

async function fetchBatas(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function kunciBawwabah(): string | null {
  return process.env.BAWABAH_API_KEY || null;
}

/** Catat langkah propagasi ke audit Postgres + audit.json (best-effort). */
async function catatPropagasi(
  actor: Aktor,
  aksi: string,
  targetId: string,
  detail: string
): Promise<void> {
  try {
    const client = await getPool().connect();
    try {
      await insertAuditLog(client, {
        aktorId: actor.id,
        aktorUsername: actor.username,
        aksi,
        targetId,
        detail,
      });
    } finally {
      client.release();
    }
  } catch {
    // Audit tidak boleh menggagalkan propagasi.
  }
  try {
    await appendAudit({
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi,
      targetId,
      detail,
    });
  } catch {
    // Sama — audit tidak boleh menggagalkan propagasi.
  }
}

/** Cari id baris Dufah di PPDB berdasarkan nama persis (fallback — dipakai
 * hanya bila periode belum punya ppdbDufahId tersimpan). */
export async function cariDufahIdPPDB(
  namaDufah: string
): Promise<{ id: number | null; error?: string }> {
  try {
    const res = await fetchBatas(`${PPDB_URL}/api/dufah`, {}, 10_000);
    if (!res.ok) return { id: null, error: `PPDB menjawab HTTP ${res.status}` };
    const daftar = (await res.json()) as Array<{ id: number; nama: string }>;
    if (!Array.isArray(daftar)) return { id: null, error: "Respons PPDB tidak sesuai" };
    const baris = daftar.find((d) => d.nama === namaDufah);
    if (!baris) return { id: null, error: `Dufah "${namaDufah}" belum dibuat di PPDB` };
    return { id: baris.id };
  } catch (e) {
    return {
      id: null,
      error: e instanceof Error ? e.message : "PPDB tidak dapat dijangkau",
    };
  }
}

/**
 * Buat baris Dufah di PPDB untuk satu draf Bawwabah (rancangan
 * PPDB-pendaftaran). Dipanggil SETELAH draf tersimpan (transaksi Bawwabah
 * sudah komit) — PPDB sistem lain, tidak boleh di transaksi yang sama.
 * Gagal TIDAK menggagalkan pembuatan draf: ppdbDufahId tetap null dan
 * pemanggil menampilkan status "belum tersinkron ke PPDB" + tombol coba
 * lagi. Id baris PPDB yang berhasil dibuat disimpan ke periods.
 */
export async function sinkronDufahKePPDB(
  periode: Period,
  actor: Aktor
): Promise<LangkahHasil & { dufahId?: number; sudahAda?: boolean }> {
  const key = kunciBawwabah();
  if (!key) return { ok: false, error: "BAWABAH_API_KEY belum disetel" };
  try {
    const res = await fetchBatas(
      `${PPDB_URL}/api/bawwabah/dufah`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bawwabah-key": key,
        },
        body: JSON.stringify({
          bawwabahPeriodId: periode.id,
          nama: periode.namaDufah,
          tanggalBuka: periode.tanggalBuka,
          tanggalTutup: periode.tanggalTutup,
          isTahunBaru: periode.isTahunBaru,
        }),
      },
      15_000
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const pesan =
        typeof data.error === "string"
          ? data.error
          : `PPDB menjawab HTTP ${res.status}`;
      await catatPropagasi(actor, "sync_ppdb_dufah_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
      return { ok: false, error: pesan };
    }
    const dufahId = typeof data.dufahId === "number" ? data.dufahId : null;
    if (dufahId !== null) {
      await simpanPpdbDufahId(periode.id, dufahId).catch(() => undefined);
    }
    await catatPropagasi(
      actor,
      "sync_ppdb_dufah_ok",
      periode.id,
      `${periode.namaDufah}: baris PPDB id ${dufahId ?? "?"}${data.sudahAda ? " (sudah ada — dipakai ulang)" : " dibuat"}`
    );
    return {
      ok: true,
      dufahId: dufahId ?? undefined,
      sudahAda: data.sudahAda === true,
    };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "PPDB tidak dapat dijangkau";
    await catatPropagasi(actor, "sync_ppdb_dufah_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
    return { ok: false, error: pesan };
  }
}

/** Baca dufah aktif PPDB saat ini (nama) — untuk verifikasi. */
export async function bacaDufahAktifPPDB(): Promise<string | null> {
  try {
    const res = await fetchBatas(`${PPDB_URL}/api/dufah`, {}, 10_000);
    if (!res.ok) return null;
    const daftar = (await res.json()) as Array<{
      id: number;
      nama: string;
      isActive: boolean;
    }>;
    if (!Array.isArray(daftar)) return null;
    return daftar.find((d) => d.isActive)?.nama ?? null;
  } catch {
    return null;
  }
}

/** Baca status periode Siakad (dufah aktif turunan + hitungan + sync terakhir). */
export async function bacaStatusSiakad(): Promise<{
  dufahAktif: string | null;
  jumlahSantriAktif: number | null;
  lastSyncedAt: string | null;
  error?: string;
}> {
  const key = kunciBawwabah();
  if (!key) return { dufahAktif: null, jumlahSantriAktif: null, lastSyncedAt: null, error: "BAWABAH_API_KEY belum disetel" };
  try {
    const res = await fetchBatas(
      `${SIAKAD_URL}/api/bawwabah/status`,
      { headers: { "x-bawwabah-key": key } },
      15_000
    );
    if (!res.ok) {
      return { dufahAktif: null, jumlahSantriAktif: null, lastSyncedAt: null, error: `Siakad menjawab HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      dufahAktif: string | null;
      jumlahSantriAktif: number;
      lastSyncedAt: string | null;
    };
    return {
      dufahAktif: data.dufahAktif ?? null,
      jumlahSantriAktif: data.jumlahSantriAktif ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
    };
  } catch (e) {
    return {
      dufahAktif: null,
      jumlahSantriAktif: null,
      lastSyncedAt: null,
      error: e instanceof Error ? e.message : "Siakad tidak dapat dijangkau",
    };
  }
}

/** Panggil rollover PPDB untuk satu periode. */
export async function panggilRolloverPPDB(
  periode: Period,
  dufahId: number,
  actor: Aktor
): Promise<LangkahHasil & { sudahDilakukan?: boolean }> {
  const key = kunciBawwabah();
  if (!key) return { ok: false, error: "BAWABAH_API_KEY belum disetel" };
  try {
    const res = await fetchBatas(
      `${PPDB_URL}/api/bawwabah/rollover`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bawwabah-key": key,
        },
        body: JSON.stringify({
          dufahId,
          namaDufah: periode.namaDufah,
          isTahunBaru: periode.isTahunBaru,
          idempotencyKey: periode.id,
        }),
      },
      120_000
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const pesan = typeof data.error === "string" ? data.error : `PPDB menjawab HTTP ${res.status}`;
      await catatPropagasi(actor, "rollover_ppdb_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
      return { ok: false, error: pesan };
    }
    await catatPropagasi(
      actor,
      "rollover_ppdb_ok",
      periode.id,
      `${periode.namaDufah}: CO ${data.coCount ?? "?"} santri, ${data.riwayatBaru ?? "?"} riwayat baru, ${data.mutasiCount ?? "?"} mutasi sakan` +
        (data.sudahDilakukan ? " (sudah pernah dilakukan — hasil lama dipakai)" : "")
    );
    return {
      ok: true,
      sudahDilakukan: data.sudahDilakukan === true,
      coCount: data.coCount,
      flipCount: data.flipCount,
      riwayatBaru: data.riwayatBaru,
      mutasiCount: data.mutasiCount,
      santriAktif: data.santriAktif,
      webhook: data.webhook,
    };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "PPDB tidak dapat dijangkau";
    await catatPropagasi(actor, "rollover_ppdb_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
    return { ok: false, error: pesan };
  }
}

/** Tanggal hari ini (WIB) sebagai YYYY-MM-DD. */
function hariIniWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Flag aktif Usbu dihitung dari tanggal + hari ini (WIB). */
export function hitungFlagUsbuAktif(p: Period): {
  usbu1Active: boolean;
  usbu2Active: boolean;
  usbu3Active: boolean;
} {
  const hariIni = hariIniWIB();
  const aktif = (mulai: string | null, selesai: string | null): boolean =>
    !!mulai && !!selesai && mulai <= hariIni && hariIni <= selesai;
  return {
    usbu1Active: aktif(p.usbu1StartDate, p.usbu1EndDate),
    usbu2Active: aktif(p.usbu2StartDate, p.usbu2EndDate),
    usbu3Active: aktif(p.usbu3StartDate, p.usbu3EndDate),
  };
}

/** Apakah tanggal Usbu periode sudah lengkap (keenam field terisi). */
export function usbuLengkap(p: Period): boolean {
  return Boolean(
    p.usbu1StartDate && p.usbu1EndDate &&
      p.usbu2StartDate && p.usbu2EndDate &&
      p.usbu3StartDate && p.usbu3EndDate
  );
}

/** Kirim tanggal Usbu periode ke Siakad (POST /api/admin/dufah/usbu). */
export async function syncUsbuKeSiakad(
  periode: Period,
  actor: Aktor
): Promise<LangkahHasil> {
  const key = kunciBawwabah();
  if (!key) return { ok: false, error: "BAWABAH_API_KEY belum disetel" };
  if (!usbuLengkap(periode)) {
    return { ok: false, error: "Tanggal Usbu belum lengkap" };
  }
  const flag = hitungFlagUsbuAktif(periode);
  try {
    const res = await fetchBatas(
      `${SIAKAD_URL}/api/admin/dufah/usbu`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bawwabah-key": key,
        },
        body: JSON.stringify({
          nama: periode.namaDufah,
          usbu1StartDate: periode.usbu1StartDate,
          usbu1EndDate: periode.usbu1EndDate,
          usbu1Active: flag.usbu1Active,
          usbu2StartDate: periode.usbu2StartDate,
          usbu2EndDate: periode.usbu2EndDate,
          usbu2Active: flag.usbu2Active,
          usbu3StartDate: periode.usbu3StartDate,
          usbu3EndDate: periode.usbu3EndDate,
          usbu3Active: flag.usbu3Active,
        }),
      },
      15_000
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const pesan =
        res.status === 404
          ? "Siakad belum punya baris dufah ini — sync Usbu akan dikirim ulang otomatis setelah aktivasi"
          : typeof data.error === "string"
            ? data.error
            : `Siakad menjawab HTTP ${res.status}`;
      await catatPropagasi(actor, "sync_usbu_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
      return { ok: false, error: pesan, belumAdaDiSiakad: res.status === 404 };
    }
    await catatPropagasi(
      actor,
      "sync_usbu_ok",
      periode.id,
      `${periode.namaDufah}: Usbu 1 ${periode.usbu1StartDate}–${periode.usbu1EndDate}, Usbu 2 ${periode.usbu2StartDate}–${periode.usbu2EndDate}, Usbu 3 ${periode.usbu3StartDate}–${periode.usbu3EndDate}`
    );
    return { ok: true, ...flag };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Siakad tidak dapat dijangkau";
    await catatPropagasi(actor, "sync_usbu_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
    return { ok: false, error: pesan };
  }
}

/** Umumkan periode baru ke E-Maliyah (auto-create mapping bulan↔dufah). */
export async function umumkanKeEmaliyah(
  periode: Period,
  actor: Aktor
): Promise<LangkahHasil> {
  const key = kunciBawwabah();
  if (!key) return { ok: false, error: "BAWABAH_API_KEY belum disetel" };
  if (!usbuLengkap(periode)) {
    return { ok: false, error: "Tanggal Usbu belum lengkap — mapping E-Maliyah menunggu tanggal Usbu" };
  }
  try {
    const res = await fetchBatas(
      `${EMALIYAH_URL}/api/v1/webhooks/bawwabah/period`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": key,
        },
        body: JSON.stringify({
          dufah_name: periode.namaDufah,
          start_date: periode.usbu1StartDate,
          end_date: periode.usbu3EndDate,
        }),
      },
      15_000
    );
    // Amplop E-Maliyah: { success, message, data } — isi ada di `data`.
    const amplop = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const isi = (amplop.data ?? {}) as Record<string, unknown>;
    if (!res.ok) {
      const pesan =
        typeof amplop.message === "string"
          ? amplop.message
          : `E-Maliyah menjawab HTTP ${res.status}`;
      await catatPropagasi(actor, "umumkan_emaliyah_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
      return { ok: false, error: pesan };
    }
    await catatPropagasi(
      actor,
      "umumkan_emaliyah_ok",
      periode.id,
      `${periode.namaDufah}: mapping ${isi.month ? `bulan ${isi.month}/${isi.year}` : ""}` +
        (isi.sudahAda ? " (sudah ada — dipakai ulang)" : " dibuat")
    );
    return { ok: true, sudahAda: isi.sudahAda === true, month: isi.month, year: isi.year };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "E-Maliyah tidak dapat dijangkau";
    await catatPropagasi(actor, "umumkan_emaliyah_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
    return { ok: false, error: pesan };
  }
}

/** Panggil sync santri Siakad (tombol Kirim Ulang). */
export async function kirimUlangSyncSiakad(
  periode: Period,
  actor: Aktor
): Promise<LangkahHasil> {
  const key = kunciBawwabah();
  if (!key) return { ok: false, error: "BAWABAH_API_KEY belum disetel" };
  try {
    const res = await fetchBatas(
      `${SIAKAD_URL}/api/admin/sync-santri`,
      {
        method: "POST",
        headers: { "x-bawwabah-key": key },
      },
      180_000
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const pesan = typeof data.error === "string" ? data.error : `Siakad menjawab HTTP ${res.status}`;
      await catatPropagasi(actor, "kirim_ulang_siakad_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
      return { ok: false, error: pesan };
    }
    await catatPropagasi(
      actor,
      "kirim_ulang_siakad_ok",
      periode.id,
      `${periode.namaDufah}: ${data.syncedCount ?? "?"} santri disinkronkan, ${data.newDufahCount ?? "?"} dufah baru`
    );
    return {
      ok: true,
      syncedCount: data.syncedCount,
      newRiwayatCount: data.newRiwayatCount,
      newDufahCount: data.newDufahCount,
      deactivatedCount: data.deactivatedCount,
    };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Siakad tidak dapat dijangkau";
    await catatPropagasi(actor, "kirim_ulang_siakad_gagal", periode.id, `${periode.namaDufah}: ${pesan}`);
    return { ok: false, error: pesan };
  }
}

/**
 * Jalankan seluruh propagasi untuk satu periode yang SUDAH aktif di
 * Bawwabah: rollover PPDB (dilewati bila PPDB sudah mengaktifkan dufah
 * yang sama — mis. percobaan ulang), verifikasi, sync Usbu, umumkan
 * E-Maliyah. Mengembalikan hasil per langkah; TIDAK pernah throw untuk
 * kegagalan jaringan/HTTP (dikembalikan sebagai { ok: false }).
 */
export async function jalankanPropagasi(
  periode: Period,
  actor: Aktor
): Promise<HasilPropagasi> {
  const hasil: HasilPropagasi = {
    ppdbDufahId: null,
    rollover: null,
    verifikasi: {
      ppdbAktif: null,
      siakadAktif: null,
      siakadJumlah: null,
      siakadLastSync: null,
    },
    usbu: null,
    emaliyah: null,
  };

  // Id baris PPDB: pakai ppdbDufahId tersimpan (rancangan PPDB-pendaftaran).
  // Bila belum ada (draf lama / sync gagal), fallback cari by-nama lalu
  // simpan id yang ketemu supaya aktivasi berikutnya tidak perlu cocok
  // nama lagi.
  let cari: { id: number | null; error?: string };
  if (periode.ppdbDufahId !== null && periode.ppdbDufahId !== undefined) {
    cari = { id: periode.ppdbDufahId };
  } else {
    cari = await cariDufahIdPPDB(periode.namaDufah);
    if (cari.id !== null) {
      await simpanPpdbDufahId(periode.id, cari.id).catch(() => undefined);
    }
  }
  hasil.ppdbDufahId = cari.id;
  if (cari.id === null) {
    hasil.rollover = { ok: false, error: cari.error ?? "Dufah tidak ditemukan di PPDB" };
  } else {
    // Bila PPDB sudah mengaktifkan dufah ini (mis. percobaan ulang atau
    // aktivasi manual), jangan panggil rollover lagi — verifikasi saja.
    const ppdbAktifAwal = await bacaDufahAktifPPDB();
    if (ppdbAktifAwal === periode.namaDufah) {
      hasil.rollover = { ok: true, sudahDilakukan: true };
    } else {
      hasil.rollover = await panggilRolloverPPDB(periode, cari.id, actor);
    }
  }

  // Verifikasi (apa pun hasil rollover — supaya UI selalu menampilkan
  // keadaan nyata kedua web).
  const [ppdbAktif, siakad] = await Promise.all([
    bacaDufahAktifPPDB(),
    bacaStatusSiakad(),
  ]);
  hasil.verifikasi = {
    ppdbAktif,
    siakadAktif: siakad.dufahAktif,
    siakadJumlah: siakad.jumlahSantriAktif,
    siakadLastSync: siakad.lastSyncedAt,
  };

  // Sync Usbu + umumkan E-Maliyah — hanya bila tanggal Usbu lengkap
  // DAN verifikasi baca-balik menunjukkan PPDB sudah mengaktifkan dufah
  // ini. (Bila Usbu belum lengkap, keduanya menunggu sampai Usbu
  // ditetapkan — pemicunya adalah endpoint edit Usbu, bukan di sini.
  // Bila rollover gagal, tidak ada yang dikirim ke mana pun.)
  if (hasil.verifikasi.ppdbAktif === periode.namaDufah && usbuLengkap(periode)) {
    hasil.usbu = await syncUsbuKeSiakad(periode, actor);
    hasil.emaliyah = await umumkanKeEmaliyah(periode, actor);
  }

  return hasil;
}
