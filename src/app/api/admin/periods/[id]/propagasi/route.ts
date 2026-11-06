import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { getPeriodById } from "@/lib/periods";
import { jalankanPropagasi } from "@/lib/propagate";

// POST /api/admin/periods/[id]/propagasi — coba lagi propagasi untuk
// periode BERJALAN (Fase 7). Dipakai bila percobaan pertama gagal
// (mis. PPDB tidak dapat dijangkau saat aktivasi, atau dufah baru dibuat
// di PPDB sesudah aktivasi lokal). Rollover dilewati bila PPDB sudah
// mengaktifkan dufah ini; verifikasi + sync Usbu + E-Maliyah tetap
// dijalankan. TIDAK PERNAH mengaktifkan periode lain atau mengulang
// periode lama — hanya periode berjalan.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const periode = await getPeriodById(params.id);
    if (!periode) {
      return NextResponse.json({ error: "Periode tidak ada" }, { status: 404 });
    }
    if (!periode.isCurrent) {
      return NextResponse.json(
        { error: "Hanya periode berjalan yang bisa dipropagasikan ulang" },
        { status: 400 }
      );
    }
    const propagasi = await jalankanPropagasi(periode, {
      id: s.user.id,
      username: s.user.username,
    });
    return NextResponse.json({ periode, propagasi });
  } catch (e) {
    console.error("POST /api/admin/periods/[id]/propagasi gagal:", e);
    return NextResponse.json({ error: "Gagal menjalankan propagasi" }, { status: 500 });
  }
}
