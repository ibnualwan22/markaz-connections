import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import {
  activatePeriod,
  detailAktivasi,
  PeriodError,
} from "@/lib/periods";
import { jalankanPropagasi } from "@/lib/propagate";

// Aktivasi draf periode — SATU TRANSAKSI di Postgres (lihat lib/periods).
// Fase 7: aktivasi lokal DILANJUTKAN propagasi — Bawwabah memicu rollover
// di PPDB (transaksi di sana + webhook ke Siakad), lalu memverifikasi
// kedua web dan (bila tanggal Usbu sudah lengkap) mengirim Usbu ke Siakad
// + mengumumkan ke E-Maliyah. Propagasi bersifat best-effort: bila PPDB /
// Siakad / E-Maliyah tidak dapat dijangkau, aktivasi lokal TETAP berdiri
// (sudah terkomit) dan hasilnya dikembalikan sebagai { propagasi } supaya
// UI bisa menampilkan status + tombol coba lagi. TIDAK ADA jalan kembali:
// periode yang sudah aktif tidak bisa diaktifkan ulang atau dibatalkan.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const periode = await activatePeriod(params.id, {
      id: s.user.id,
      username: s.user.username,
    });
    await appendAudit({
      aktorId: s.user.id,
      aktorUsername: s.user.username,
      aksi: "aktivasi_periode",
      targetId: periode.id,
      detail: `${detailAktivasi(periode, periode.isTahunBaru)}, oleh ${s.user.username}`,
    });
    const propagasi = await jalankanPropagasi(periode, {
      id: s.user.id,
      username: s.user.username,
    });
    return NextResponse.json({ periode, propagasi });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/admin/periods/[id]/activate gagal:", e);
    return NextResponse.json({ error: "Gagal mengaktifkan periode" }, { status: 500 });
  }
}
