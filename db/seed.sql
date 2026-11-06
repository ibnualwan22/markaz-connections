-- Seed baris awal periode berjalan — Fase 4 Bawwabah.
-- Dijalankan SEKALI saat implementasi (6 Nov 2026). Nilai dari data live
-- yang sudah diverifikasi (PPDB Dufah 94 + Siakad Dufah 94); tanggal
-- dimasukkan sekali di Bawwabah, bukan diimpor (keputusan user 6 Nov 2026).
-- Waktu 17:00 WIB = 10:00 UTC. Jangan jalankan ulang (id + nama unik).

INSERT INTO periods (
  id, "namaDufah", "noDufah", "noMarhalah", "noNukhbah",
  "tanggalBuka", "tanggalTutup", "isTahunBaru",
  "usbu1StartDate", "usbu1EndDate",
  "usbu2StartDate", "usbu2EndDate",
  "usbu3StartDate", "usbu3EndDate",
  "isCurrent", "activatedAt", "activatedById", "activatedByUsername",
  "createdByUsername"
) VALUES (
  'p-f0241cd9206f0055c95e41bd', 'Duf''ah 94', 94, 5, 1,
  '2026-09-13T10:00:00Z', '2026-10-14T10:00:00Z', false,
  '2026-10-12', '2026-10-16',
  '2026-10-19', '2026-10-23',
  '2026-10-26', '2026-11-06',
  true, now(), 'sistem', 'sistem (baris awal)',
  'sistem (baris awal)'
);

INSERT INTO period_audit_log ("aktorId", "aktorUsername", aksi, "targetId", detail)
VALUES (
  'sistem', 'sistem (baris awal)', 'seed_periode', 'p-f0241cd9206f0055c95e41bd',
  'Duf''ah 94 / Marhalah 5 / Nukhbah 1 — baris awal, periode berjalan saat Bawwabah mengambil alih'
);
