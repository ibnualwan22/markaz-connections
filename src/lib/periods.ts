// Akses data periode — Fase 4 Bawwabah (Postgres bawwabah-db).
// Satu baris = satu periode. Baris tidak pernah ditimpa setelah aktif;
// riwayat hanya dibaca. Tidak ada jalan kembali ke periode lama.
import { Pool, PoolClient } from "pg";
import { randomBytes } from "crypto";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum disetel");
    pool = new Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

export interface Period {
  id: string;
  namaDufah: string;
  noDufah: number;
  noMarhalah: number;
  noNukhbah: number;
  tanggalBuka: string; // ISO
  tanggalTutup: string; // ISO
  isTahunBaru: boolean;
  usbu1StartDate: string | null; // YYYY-MM-DD
  usbu1EndDate: string | null;
  usbu2StartDate: string | null;
  usbu2EndDate: string | null;
  usbu3StartDate: string | null;
  usbu3EndDate: string | null;
  isCurrent: boolean;
  activatedAt: string | null; // ISO
  activatedById: string | null;
  activatedByUsername: string | null;
  createdAt: string; // ISO
  createdByUsername: string;
}

export interface PeriodInput {
  namaDufah: string;
  tanggalBuka: string; // ISO datetime
  tanggalTutup: string; // ISO datetime
  isTahunBaru: boolean;
  usbu1StartDate?: string | null;
  usbu1EndDate?: string | null;
  usbu2StartDate?: string | null;
  usbu2EndDate?: string | null;
  usbu3StartDate?: string | null;
  usbu3EndDate?: string | null;
}

export interface NextNumbers {
  noDufah: number;
  noMarhalah: number;
  noNukhbah: number;
  namaDufah: string;
}

function generatePeriodId(): string {
  // Pola p-<cuid>: p- + 24 karakter [a-z0-9].
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(24);
  let s = "";
  for (const b of bytes) s += chars[b % chars.length];
  return "p-" + s;
}

function rowToPeriod(r: Record<string, unknown>): Period {
  const asIso = (v: unknown): string | null =>
    v instanceof Date ? v.toISOString() : v == null ? null : String(v);
  const asDate = (v: unknown): string | null => {
    if (v == null) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  };
  return {
    id: String(r.id),
    namaDufah: String(r.namaDufah),
    noDufah: Number(r.noDufah),
    noMarhalah: Number(r.noMarhalah),
    noNukhbah: Number(r.noNukhbah),
    tanggalBuka: asIso(r.tanggalBuka) as string,
    tanggalTutup: asIso(r.tanggalTutup) as string,
    isTahunBaru: Boolean(r.isTahunBaru),
    usbu1StartDate: asDate(r.usbu1StartDate),
    usbu1EndDate: asDate(r.usbu1EndDate),
    usbu2StartDate: asDate(r.usbu2StartDate),
    usbu2EndDate: asDate(r.usbu2EndDate),
    usbu3StartDate: asDate(r.usbu3StartDate),
    usbu3EndDate: asDate(r.usbu3EndDate),
    isCurrent: Boolean(r.isCurrent),
    activatedAt: asIso(r.activatedAt),
    activatedById: r.activatedById == null ? null : String(r.activatedById),
    activatedByUsername:
      r.activatedByUsername == null ? null : String(r.activatedByUsername),
    createdAt: asIso(r.createdAt) as string,
    createdByUsername: String(r.createdByUsername),
  };
}

export async function listPeriods(): Promise<Period[]> {
  const { rows } = await getPool().query(
    'SELECT * FROM periods ORDER BY "noDufah" DESC'
  );
  return rows.map(rowToPeriod);
}

export async function getCurrentPeriod(): Promise<Period | null> {
  const { rows } = await getPool().query(
    'SELECT * FROM periods WHERE "isCurrent" = true LIMIT 1'
  );
  return rows.length ? rowToPeriod(rows[0]) : null;
}

export async function getPeriodById(id: string): Promise<Period | null> {
  const { rows } = await getPool().query(
    "SELECT * FROM periods WHERE id = $1",
    [id]
  );
  return rows.length ? rowToPeriod(rows[0]) : null;
}

/** Nomor berikutnya = baris berjalan + 1 per angka (keputusan no. 15/22). */
export async function nextNumbers(): Promise<NextNumbers> {
  const current = await getCurrentPeriod();
  if (!current) {
    return { noDufah: 1, noMarhalah: 1, noNukhbah: 1, namaDufah: "Duf'ah 1" };
  }
  const noDufah = current.noDufah + 1;
  return {
    noDufah,
    noMarhalah: current.noMarhalah + 1,
    noNukhbah: current.noNukhbah + 1,
    namaDufah: `Duf'ah ${noDufah}`,
  };
}

export function ringkasanPeriode(p: {
  namaDufah: string;
  noMarhalah: number;
  noNukhbah: number;
  isTahunBaru?: boolean;
}): string {
  return `${p.namaDufah} / Marhalah ${p.noMarhalah} / Nukhbah ${p.noNukhbah}`;
}

export function detailAktivasi(p: Period, tahunBaru: boolean): string {
  return `${ringkasanPeriode(p)}, tahunBaru=${tahunBaru}`;
}

function tanggalValid(s: unknown): s is string {
  return typeof s === "string" && s.trim() !== "" && !Number.isNaN(Date.parse(s));
}

function tanggalUsbuValid(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s))
  );
}

/**
 * Validasi input draf (rancangan §5a). Mengembalikan pesan error, atau null
 * bila sah. `abaikanId` dipakai saat edit supaya nama sendiri tidak
 * dianggap duplikat. Pemeriksaan duplikat nama + satu draf dilakukan di
 * fungsi pemanggil (butuh akses DB).
 */
export function validasiInput(input: PeriodInput): string | null {
  if (!input.namaDufah || typeof input.namaDufah !== "string" || !input.namaDufah.trim()) {
    return "Nama Dufah wajib diisi";
  }
  if (!tanggalValid(input.tanggalBuka)) return "Tanggal buka pendaftaran tidak valid";
  if (!tanggalValid(input.tanggalTutup)) return "Tanggal tutup pendaftaran tidak valid";
  if (Date.parse(input.tanggalTutup) <= Date.parse(input.tanggalBuka)) {
    return "Tanggal tutup harus sesudah tanggal buka";
  }
  const usbu: Array<[string, unknown, unknown]> = [
    ["Usbu 1", input.usbu1StartDate, input.usbu1EndDate],
    ["Usbu 2", input.usbu2StartDate, input.usbu2EndDate],
    ["Usbu 3", input.usbu3StartDate, input.usbu3EndDate],
  ];
  let akhirSebelumnya: string | null = null;
  for (const [label, mulai, selesai] of usbu) {
    const adaMulai = mulai !== undefined && mulai !== null && mulai !== "";
    const adaSelesai = selesai !== undefined && selesai !== null && selesai !== "";
    if (adaMulai !== adaSelesai) {
      return `${label}: tanggal mulai dan selesai harus diisi berdua`;
    }
    if (adaMulai) {
      if (!tanggalUsbuValid(mulai) || !tanggalUsbuValid(selesai)) {
        return `${label}: tanggal tidak valid (format YYYY-MM-DD)`;
      }
      if ((selesai as string) <= (mulai as string)) {
        return `${label}: tanggal selesai harus sesudah tanggal mulai`;
      }
      if (akhirSebelumnya !== null && (mulai as string) <= akhirSebelumnya) {
        return `${label}: tanggal mulai harus sesudah akhir usbu sebelumnya`;
      }
      akhirSebelumnya = selesai as string;
    }
  }
  return null;
}

/** Field Usbu yang masih kosong pada satu baris (untuk pesan aktivasi). */
export function usbuYangKosong(p: Period): string[] {
  const kosong: string[] = [];
  const pasangan: Array<[string, string | null]> = [
    ["Usbu 1 mulai", p.usbu1StartDate],
    ["Usbu 1 selesai", p.usbu1EndDate],
    ["Usbu 2 mulai", p.usbu2StartDate],
    ["Usbu 2 selesai", p.usbu2EndDate],
    ["Usbu 3 mulai", p.usbu3StartDate],
    ["Usbu 3 selesai", p.usbu3EndDate],
  ];
  for (const [label, nilai] of pasangan) {
    if (!nilai) kosong.push(label);
  }
  return kosong;
}

export async function insertAuditLog(
  client: PoolClient,
  entry: {
    aktorId: string;
    aktorUsername: string;
    aksi: string;
    targetId?: string | null;
    detail?: string | null;
  }
): Promise<void> {
  await client.query(
    'INSERT INTO period_audit_log ("aktorId", "aktorUsername", aksi, "targetId", detail) VALUES ($1, $2, $3, $4, $5)',
    [
      entry.aktorId,
      entry.aktorUsername,
      entry.aksi,
      entry.targetId ?? null,
      entry.detail ?? null,
    ]
  );
}

export class PeriodError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalisasiUsbu(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  return String(v).slice(0, 10);
}

/**
 * Buat draf periode baru. Nomor diambil dari baris berjalan + 1 (server yang
 * menentukan — klien hanya mengirim nama/tanggal). Menolak bila sudah ada
 * draf lain atau nama sudah dipakai.
 */
export async function createPeriod(
  input: PeriodInput,
  actor: { id: string; username: string }
): Promise<Period> {
  const salah = validasiInput(input);
  if (salah) throw new PeriodError(400, salah);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const draf = await client.query(
      'SELECT id FROM periods WHERE "activatedAt" IS NULL LIMIT 1'
    );
    if (draf.rows.length) {
      throw new PeriodError(
        400,
        "Sudah ada draf periode yang belum diaktifkan. Selesaikan dulu draf tersebut — aktifkan atau hapus — sebelum membuat yang baru."
      );
    }
    const duplikat = await client.query(
      'SELECT id FROM periods WHERE "namaDufah" = $1 LIMIT 1',
      [input.namaDufah.trim()]
    );
    if (duplikat.rows.length) {
      throw new PeriodError(400, `Nama "${input.namaDufah.trim()}" sudah dipakai periode lain`);
    }
    const next = await getCurrentPeriod();
    const noDufah = next ? next.noDufah + 1 : 1;
    const noMarhalah = next ? next.noMarhalah + 1 : 1;
    const noNukhbah = next ? next.noNukhbah + 1 : 1;
    const id = generatePeriodId();
    const { rows } = await client.query(
      `INSERT INTO periods (
        id, "namaDufah", "noDufah", "noMarhalah", "noNukhbah",
        "tanggalBuka", "tanggalTutup", "isTahunBaru",
        "usbu1StartDate", "usbu1EndDate",
        "usbu2StartDate", "usbu2EndDate",
        "usbu3StartDate", "usbu3EndDate",
        "isCurrent", "activatedAt", "createdByUsername"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,NULL,$15)
      RETURNING *`,
      [
        id,
        input.namaDufah.trim(),
        noDufah,
        noMarhalah,
        noNukhbah,
        input.tanggalBuka,
        input.tanggalTutup,
        Boolean(input.isTahunBaru),
        normalisasiUsbu(input.usbu1StartDate),
        normalisasiUsbu(input.usbu1EndDate),
        normalisasiUsbu(input.usbu2StartDate),
        normalisasiUsbu(input.usbu2EndDate),
        normalisasiUsbu(input.usbu3StartDate),
        normalisasiUsbu(input.usbu3EndDate),
        actor.username,
      ]
    );
    const periode = rowToPeriod(rows[0]);
    await insertAuditLog(client, {
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi: "buat_periode",
      targetId: periode.id,
      detail: ringkasanPeriode(periode),
    });
    await client.query("COMMIT");
    return periode;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

/** Ubah draf yang belum aktif. Baris aktif/riwayat tidak bisa diubah. */
export async function updateDraft(
  id: string,
  input: PeriodInput,
  actor: { id: string; username: string }
): Promise<Period> {
  const salah = validasiInput(input);
  if (salah) throw new PeriodError(400, salah);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      'SELECT * FROM periods WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!rows.length) throw new PeriodError(404, "Periode tidak ada");
    const lama = rowToPeriod(rows[0]);
    if (lama.activatedAt !== null || lama.isCurrent) {
      throw new PeriodError(400, "Periode yang sudah aktif atau sudah menjadi riwayat tidak bisa diubah");
    }
    const duplikat = await client.query(
      'SELECT id FROM periods WHERE "namaDufah" = $1 AND id <> $2 LIMIT 1',
      [input.namaDufah.trim(), id]
    );
    if (duplikat.rows.length) {
      throw new PeriodError(400, `Nama "${input.namaDufah.trim()}" sudah dipakai periode lain`);
    }
    const { rows: baru } = await client.query(
      `UPDATE periods SET
        "namaDufah" = $2, "tanggalBuka" = $3, "tanggalTutup" = $4, "isTahunBaru" = $5,
        "usbu1StartDate" = $6, "usbu1EndDate" = $7,
        "usbu2StartDate" = $8, "usbu2EndDate" = $9,
        "usbu3StartDate" = $10, "usbu3EndDate" = $11
      WHERE id = $1 RETURNING *`,
      [
        id,
        input.namaDufah.trim(),
        input.tanggalBuka,
        input.tanggalTutup,
        Boolean(input.isTahunBaru),
        normalisasiUsbu(input.usbu1StartDate),
        normalisasiUsbu(input.usbu1EndDate),
        normalisasiUsbu(input.usbu2StartDate),
        normalisasiUsbu(input.usbu2EndDate),
        normalisasiUsbu(input.usbu3StartDate),
        normalisasiUsbu(input.usbu3EndDate),
      ]
    );
    const periode = rowToPeriod(baru[0]);
    const perubahan: string[] = [];
    if (lama.namaDufah !== periode.namaDufah) {
      perubahan.push(`nama: ${lama.namaDufah} -> ${periode.namaDufah}`);
    }
    if (lama.isTahunBaru !== periode.isTahunBaru) {
      perubahan.push(`tahunBaru: ${lama.isTahunBaru} -> ${periode.isTahunBaru}`);
    }
    await insertAuditLog(client, {
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi: "edit_periode",
      targetId: periode.id,
      detail:
        perubahan.length > 0
          ? `${ringkasanPeriode(periode)} (${perubahan.join("; ")})`
          : ringkasanPeriode(periode),
    });
    await client.query("COMMIT");
    return periode;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

/** Hapus draf yang belum aktif. Baris aktif/riwayat tidak bisa dihapus. */
export async function deleteDraft(
  id: string,
  actor: { id: string; username: string }
): Promise<Period> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      'SELECT * FROM periods WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!rows.length) throw new PeriodError(404, "Periode tidak ada");
    const periode = rowToPeriod(rows[0]);
    if (periode.activatedAt !== null || periode.isCurrent) {
      throw new PeriodError(400, "Periode yang sudah aktif atau sudah menjadi riwayat tidak bisa dihapus");
    }
    await client.query("DELETE FROM periods WHERE id = $1", [id]);
    await insertAuditLog(client, {
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi: "hapus_periode",
      targetId: periode.id,
      detail: ringkasanPeriode(periode),
    });
    await client.query("COMMIT");
    return periode;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Aktivasi draf — SATU TRANSAKSI: kunci baris draf, periksa kelengkapan
 * Usbu, pindahkan isCurrent dari baris lama ke baris baru, catat audit.
 * Gagal di titik mana pun = rollback penuh, tidak ada yang berubah.
 */
export async function activatePeriod(
  id: string,
  actor: { id: string; username: string }
): Promise<Period> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      'SELECT * FROM periods WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!rows.length) throw new PeriodError(404, "Periode tidak ada");
    const draf = rowToPeriod(rows[0]);
    if (draf.activatedAt !== null || draf.isCurrent) {
      throw new PeriodError(
        400,
        "Periode ini bukan draf — hanya draf yang bisa diaktifkan. Periode lama tidak bisa diaktifkan kembali."
      );
    }
    const kosong = usbuYangKosong(draf);
    if (kosong.length) {
      throw new PeriodError(
        400,
        `Tanggal Usbu belum lengkap: ${kosong.join(", ")}. Lengkapi dulu sebelum mengaktifkan.`
      );
    }
    // Kunci baris berjalan saat ini supaya dua aktivasi bersamaan tidak
    // menghasilkan dua periode berjalan.
    const berjalan = await client.query(
      'SELECT * FROM periods WHERE "isCurrent" = true FOR UPDATE'
    );
    if (berjalan.rows.length > 1) {
      throw new PeriodError(500, "Data tidak konsisten: lebih dari satu periode berjalan");
    }
    await client.query(
      'UPDATE periods SET "isCurrent" = false WHERE "isCurrent" = true'
    );
    const { rows: baru } = await client.query(
      `UPDATE periods SET "isCurrent" = true, "activatedAt" = now(),
        "activatedById" = $2, "activatedByUsername" = $3
      WHERE id = $1 RETURNING *`,
      [id, actor.id, actor.username]
    );
    const periode = rowToPeriod(baru[0]);
    await insertAuditLog(client, {
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi: "aktivasi_periode",
      targetId: periode.id,
      detail: `${detailAktivasi(periode, periode.isTahunBaru)}, oleh ${actor.username}`,
    });
    await client.query("COMMIT");
    return periode;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}
