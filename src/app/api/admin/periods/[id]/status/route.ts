import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { getPeriodById } from "@/lib/periods";
import {
  bacaDufahAktifPPDB,
  bacaStatusSiakad,
  usbuLengkap,
} from "@/lib/propagate";

// GET /api/admin/periods/[id]/status — baca kembali keadaan nyata kedua
// web untuk satu periode (Fase 7 §7). Dipakai UI /periode untuk mem-poll
// setelah aktivasi: PPDB sudah aktif? Siakad sudah mengikuti? Read-only,
// tanpa efek samping.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const periode = await getPeriodById(params.id);
    if (!periode) {
      return NextResponse.json({ error: "Periode tidak ada" }, { status: 404 });
    }
    const [ppdbAktif, siakad] = await Promise.all([
      bacaDufahAktifPPDB(),
      bacaStatusSiakad(),
    ]);
    return NextResponse.json({
      periode: {
        id: periode.id,
        namaDufah: periode.namaDufah,
        isCurrent: periode.isCurrent,
        usbuLengkap: usbuLengkap(periode),
      },
      ppdbAktif,
      siakadAktif: siakad.dufahAktif,
      siakadJumlah: siakad.jumlahSantriAktif,
      siakadLastSync: siakad.lastSyncedAt,
      cocok:
        ppdbAktif === periode.namaDufah &&
        siakad.dufahAktif === periode.namaDufah,
    });
  } catch (e) {
    console.error("GET /api/admin/periods/[id]/status gagal:", e);
    return NextResponse.json({ error: "Gagal membaca status propagasi" }, { status: 500 });
  }
}
