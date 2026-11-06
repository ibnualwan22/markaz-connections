import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { getPeriodById } from "@/lib/periods";
import { sinkronDufahKePPDB } from "@/lib/propagate";

// POST /api/admin/periods/[id]/sync-ppdb — coba lagi membuat baris Dufah
// di PPDB untuk satu DRAF (rancangan PPDB-pendaftaran, 6 Nov 2026).
// Dipakai bila pembuatan baris PPDB gagal saat draf dibuat (mis. PPDB
// tidak dapat dijangkau) — draf tetap tersimpan dengan ppdbDufahId null.
// Hanya draf (belum aktif) yang bisa disinkronkan; bila sudah tersinkron,
// kembalikan keadaan yang ada tanpa memanggil PPDB lagi.
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
    if (periode.activatedAt !== null || periode.isCurrent) {
      return NextResponse.json(
        { error: "Hanya draf yang bisa disinkronkan ke PPDB" },
        { status: 400 }
      );
    }
    if (periode.ppdbDufahId !== null) {
      return NextResponse.json({
        periode,
        ppdb: { ok: true, sudahAda: true, dufahId: periode.ppdbDufahId },
      });
    }
    const ppdb = await sinkronDufahKePPDB(periode, {
      id: s.user.id,
      username: s.user.username,
    });
    const periodeBaru = await getPeriodById(params.id);
    return NextResponse.json({ periode: periodeBaru ?? periode, ppdb });
  } catch (e) {
    console.error("POST /api/admin/periods/[id]/sync-ppdb gagal:", e);
    return NextResponse.json(
      { error: "Gagal menyinkronkan draf ke PPDB" },
      { status: 500 }
    );
  }
}
