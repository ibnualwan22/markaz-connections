-- Skema database periode Bawwabah — Fase 4 (manajemen periode, dicatat saja).
-- Database: bawwabah (container bawwabah-db). Dibuat 6 Nov 2026.
-- Satu baris = satu periode. Baris tidak pernah ditimpa setelah aktif;
-- riwayat hanya dibaca. Tidak ada jalan kembali ke periode lama.

CREATE TABLE IF NOT EXISTS periods (
  id text PRIMARY KEY,
  "namaDufah" text NOT NULL,
  "noDufah" integer NOT NULL,
  "noMarhalah" integer NOT NULL,
  "noNukhbah" integer NOT NULL,
  "tanggalBuka" timestamptz NOT NULL,
  "tanggalTutup" timestamptz NOT NULL,
  "isTahunBaru" boolean NOT NULL DEFAULT false,
  "usbu1StartDate" date,
  "usbu1EndDate" date,
  "usbu2StartDate" date,
  "usbu2EndDate" date,
  "usbu3StartDate" date,
  "usbu3EndDate" date,
  "isCurrent" boolean NOT NULL DEFAULT false,
  "activatedAt" timestamptz,
  "activatedById" text,
  "activatedByUsername" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "createdByUsername" text NOT NULL,
  CONSTRAINT periods_tutup_sesudah_buka CHECK ("tanggalTutup" > "tanggalBuka"),
  CONSTRAINT periods_usbu1_urut CHECK ("usbu1EndDate" IS NULL OR "usbu1StartDate" IS NULL OR "usbu1EndDate" > "usbu1StartDate"),
  CONSTRAINT periods_usbu2_urut CHECK ("usbu2EndDate" IS NULL OR "usbu2StartDate" IS NULL OR "usbu2EndDate" > "usbu2StartDate"),
  CONSTRAINT periods_usbu3_urut CHECK ("usbu3EndDate" IS NULL OR "usbu3StartDate" IS NULL OR "usbu3EndDate" > "usbu3StartDate"),
  CONSTRAINT periods_usbu_antar CHECK (
    ("usbu1EndDate" IS NULL OR "usbu2StartDate" IS NULL OR "usbu2StartDate" > "usbu1EndDate")
    AND ("usbu2EndDate" IS NULL OR "usbu3StartDate" IS NULL OR "usbu3StartDate" > "usbu2EndDate")
  )
);

-- Hanya satu baris yang boleh isCurrent = true (periode berjalan).
CREATE UNIQUE INDEX IF NOT EXISTS periods_one_current
  ON periods ("isCurrent") WHERE "isCurrent" = true;

-- Nama dufah tidak boleh duplikat (pelajaran dari varian apostrof di PPDB).
CREATE UNIQUE INDEX IF NOT EXISTS periods_nama_unique ON periods ("namaDufah");

-- Jejak audit periode — catatan otoritatif (audit.json tetap ditulis juga
-- supaya halaman Audit yang sudah ada menampilkan aksi periode).
CREATE TABLE IF NOT EXISTS period_audit_log (
  id serial PRIMARY KEY,
  waktu timestamptz NOT NULL DEFAULT now(),
  "aktorId" text NOT NULL,
  "aktorUsername" text NOT NULL,
  aksi text NOT NULL,
  "targetId" text,
  detail text
);

CREATE INDEX IF NOT EXISTS period_audit_log_waktu_idx ON period_audit_log (waktu DESC);
CREATE INDEX IF NOT EXISTS period_audit_log_aksi_idx ON period_audit_log (aksi);
