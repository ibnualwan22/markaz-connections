import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/session";

// Jumlah santri yang akan terdampak aktivasi — dibaca READ-ONLY dari PPDB
// lewat endpoint sync yang sudah ada (GET /api/santri/siakad?filter=AKTIF),
// definisi "santri aktif" yang sama dengan yang dipakai Siakad saat sync.
// Best-effort: kegagalan apa pun menghasilkan { terdampak: null } dan
// TIDAK PERNAH menghalangi aktivasi. Tidak pernah menulis ke PPDB.
export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const key = process.env.PPDB_SIAKAD_API_KEY;
  const base =
    process.env.PPDB_URL || "https://ppdb.markazarabiyah.site";
  if (!key) return NextResponse.json({ terdampak: null });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `${base}/api/santri/siakad?key=${encodeURIComponent(key)}&filter=AKTIF`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return NextResponse.json({ terdampak: null });
    const data = await res.json();
    if (!Array.isArray(data)) return NextResponse.json({ terdampak: null });
    return NextResponse.json({ terdampak: data.length });
  } catch {
    return NextResponse.json({ terdampak: null });
  }
}
