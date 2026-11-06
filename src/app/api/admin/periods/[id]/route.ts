import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import {
  updateDraft,
  deleteDraft,
  ringkasanPeriode,
  PeriodError,
  type PeriodInput,
} from "@/lib/periods";

function bacaInput(body: unknown): PeriodInput {
  const b = (body || {}) as Record<string, unknown>;
  return {
    namaDufah: typeof b.namaDufah === "string" ? b.namaDufah : "",
    tanggalBuka: typeof b.tanggalBuka === "string" ? b.tanggalBuka : "",
    tanggalTutup: typeof b.tanggalTutup === "string" ? b.tanggalTutup : "",
    isTahunBaru: b.isTahunBaru === true,
    usbu1StartDate: typeof b.usbu1StartDate === "string" ? b.usbu1StartDate : null,
    usbu1EndDate: typeof b.usbu1EndDate === "string" ? b.usbu1EndDate : null,
    usbu2StartDate: typeof b.usbu2StartDate === "string" ? b.usbu2StartDate : null,
    usbu2EndDate: typeof b.usbu2EndDate === "string" ? b.usbu2EndDate : null,
    usbu3StartDate: typeof b.usbu3StartDate === "string" ? b.usbu3StartDate : null,
    usbu3EndDate: typeof b.usbu3EndDate === "string" ? b.usbu3EndDate : null,
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
    const periode = await updateDraft(params.id, bacaInput(body), {
      id: s.user.id,
      username: s.user.username,
    });
    await appendAudit({
      aktorId: s.user.id,
      aktorUsername: s.user.username,
      aksi: "edit_periode",
      targetId: periode.id,
      detail: ringkasanPeriode(periode),
    });
    return NextResponse.json({ periode });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/admin/periods/[id] gagal:", e);
    return NextResponse.json({ error: "Gagal mengubah draf periode" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const periode = await deleteDraft(params.id, {
      id: s.user.id,
      username: s.user.username,
    });
    await appendAudit({
      aktorId: s.user.id,
      aktorUsername: s.user.username,
      aksi: "hapus_periode",
      targetId: periode.id,
      detail: ringkasanPeriode(periode),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/admin/periods/[id] gagal:", e);
    return NextResponse.json({ error: "Gagal menghapus draf periode" }, { status: 500 });
  }
}
