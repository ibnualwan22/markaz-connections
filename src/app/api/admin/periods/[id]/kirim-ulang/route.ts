import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { getPeriodById } from "@/lib/periods";
import {
  kirimUlangSyncSiakad,
  syncUsbuKeSiakad,
  umumkanKeEmaliyah,
  bacaDufahAktifPPDB,
  bacaStatusSiakad,
  usbuLengkap,
} from "@/lib/propagate";

// POST /api/admin/periods/[id]/kirim-ulang — kirim ulang sync santri ke
// Siakad (Fase 7 §7). Dipakai saat webhook PPDB -> Siakad gagal (webhook
// tanpa retry) sehingga Siakad belum mengikuti padahal PPDB sudah aktif.
// Setelah sync berhasil, baris dufah sudah ada di Siakad — bila tanggal
// Usbu lengkap, Usbu ikut dikirim ulang + E-Maliyah diumumkan (bila
// belum). Hanya untuk periode berjalan.
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
        { error: "Hanya periode berjalan yang bisa dikirim ulang" },
        { status: 400 }
      );
    }
    const actor = { id: s.user.id, username: s.user.username };
    const sync = await kirimUlangSyncSiakad(periode, actor);
    let usbu = null;
    let emaliyah = null;
    if (sync.ok && usbuLengkap(periode)) {
      usbu = await syncUsbuKeSiakad(periode, actor);
      emaliyah = await umumkanKeEmaliyah(periode, actor);
    }
    const [ppdbAktif, siakad] = await Promise.all([
      bacaDufahAktifPPDB(),
      bacaStatusSiakad(),
    ]);
    return NextResponse.json({
      periode,
      sync,
      usbu,
      emaliyah,
      verifikasi: {
        ppdbAktif,
        siakadAktif: siakad.dufahAktif,
        siakadJumlah: siakad.jumlahSantriAktif,
        siakadLastSync: siakad.lastSyncedAt,
      },
    });
  } catch (e) {
    console.error("POST /api/admin/periods/[id]/kirim-ulang gagal:", e);
    return NextResponse.json({ error: "Gagal mengirim ulang sync" }, { status: 500 });
  }
}
