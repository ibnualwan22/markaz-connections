import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import {
  activatePeriod,
  detailAktivasi,
  PeriodError,
} from "@/lib/periods";

// Aktivasi draf periode — SATU TRANSAKSI di Postgres (lihat lib/periods).
// Fase 4: hanya mencatat di Bawwabah. TIDAK menyentuh Siakad/PPDB/E-Maliyah.
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
    return NextResponse.json({ periode });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/admin/periods/[id]/activate gagal:", e);
    return NextResponse.json({ error: "Gagal mengaktifkan periode" }, { status: 500 });
  }
}
