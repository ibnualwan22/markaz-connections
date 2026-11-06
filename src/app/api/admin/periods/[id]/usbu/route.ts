import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import {
  updateUsbuDates,
  PeriodError,
  type UsbuInput,
} from "@/lib/periods";
import {
  syncUsbuKeSiakad,
  umumkanKeEmaliyah,
  usbuLengkap,
} from "@/lib/propagate";

// PATCH /api/admin/periods/[id]/usbu — ubah tanggal Usbu saja (Fase 7 §9).
// Boleh pada draf ATAU periode berjalan (amandemen Fase 7 §1); periode
// riwayat ditolak. Bila yang diubah adalah periode BERJALAN dan tanggal
// Usbu sudah lengkap, otomatis: (a) kirim Usbu ke Siakad, (b) umumkan ke
// E-Maliyah supaya mapping bulan↔dufah dibuat. Bila Usbu belum lengkap
// atau periode masih draf, hanya disimpan — pengiriman menunggu sampai
// Usbu lengkap / periode diaktifkan.
function bacaUsbu(body: unknown): UsbuInput {
  const b = (body || {}) as Record<string, unknown>;
  const ambil = (k: string): string | null =>
    typeof b[k] === "string" && b[k] !== "" ? (b[k] as string) : null;
  return {
    usbu1StartDate: ambil("usbu1StartDate"),
    usbu1EndDate: ambil("usbu1EndDate"),
    usbu2StartDate: ambil("usbu2StartDate"),
    usbu2EndDate: ambil("usbu2EndDate"),
    usbu3StartDate: ambil("usbu3StartDate"),
    usbu3EndDate: ambil("usbu3EndDate"),
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const actor = { id: s.user.id, username: s.user.username };
    const periode = await updateUsbuDates(params.id, bacaUsbu(body), actor);
    await appendAudit({
      aktorId: actor.id,
      aktorUsername: actor.username,
      aksi: "edit_usbu",
      targetId: periode.id,
      detail: `${periode.namaDufah} — Usbu 1 ${periode.usbu1StartDate ?? "-"}–${periode.usbu1EndDate ?? "-"}, Usbu 2 ${periode.usbu2StartDate ?? "-"}–${periode.usbu2EndDate ?? "-"}, Usbu 3 ${periode.usbu3StartDate ?? "-"}–${periode.usbu3EndDate ?? "-"}`,
    });
    let usbu = null;
    let emaliyah = null;
    if (periode.isCurrent && usbuLengkap(periode)) {
      usbu = await syncUsbuKeSiakad(periode, actor);
      emaliyah = await umumkanKeEmaliyah(periode, actor);
    }
    return NextResponse.json({ periode, usbu, emaliyah });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/admin/periods/[id]/usbu gagal:", e);
    return NextResponse.json({ error: "Gagal mengubah tanggal Usbu" }, { status: 500 });
  }
}
