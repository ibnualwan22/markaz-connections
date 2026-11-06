import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import {
  listPeriods,
  getCurrentPeriod,
  nextNumbers,
  createPeriod,
  ringkasanPeriode,
  PeriodError,
  type PeriodInput,
} from "@/lib/periods";
import { sinkronDufahKePPDB } from "@/lib/propagate";

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

export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const [periods, current, next] = await Promise.all([
      listPeriods(),
      getCurrentPeriod(),
      nextNumbers(),
    ]);
    return NextResponse.json({ periods, current, next });
  } catch (e) {
    console.error("GET /api/admin/periods gagal:", e);
    return NextResponse.json({ error: "Gagal memuat periode" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const periode = await createPeriod(bacaInput(body), {
      id: s.user.id,
      username: s.user.username,
    });
    await appendAudit({
      aktorId: s.user.id,
      aktorUsername: s.user.username,
      aksi: "buat_periode",
      targetId: periode.id,
      detail: ringkasanPeriode(periode),
    });
    // Buat baris dufah di PPDB — SETELAH transaksi draf komit (PPDB sistem
    // lain). Gagal TIDAK membatalkan draf: ppdbDufahId tetap null dan UI
    // menampilkan "belum tersinkron ke PPDB" + tombol coba lagi.
    const ppdb = await sinkronDufahKePPDB(periode, {
      id: s.user.id,
      username: s.user.username,
    });
    if (ppdb.ok && typeof ppdb.dufahId === "number") {
      periode.ppdbDufahId = ppdb.dufahId;
    }
    return NextResponse.json({ periode, ppdb });
  } catch (e) {
    if (e instanceof PeriodError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/admin/periods gagal:", e);
    return NextResponse.json({ error: "Gagal membuat draf periode" }, { status: 500 });
  }
}
