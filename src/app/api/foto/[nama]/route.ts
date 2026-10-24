import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSessionUser } from "@/lib/session";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const TIPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Foto hanya boleh dilihat pemiliknya atau superadmin. Nama file dibatasi
// pola ketat supaya tidak bisa traversal direktori.
export async function GET(
  _req: Request,
  { params }: { params: { nama: string } }
) {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const m = params.nama.match(/^(u-[A-Za-z0-9]+)\.(jpg|jpeg|png|webp)$/);
  if (!m) return NextResponse.json({ error: "File tidak ada" }, { status: 404 });
  const [, userId, ext] = m;
  if (userId !== s.user.id && s.user.peran !== "superadmin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, params.nama));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": TIPE[ext],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ada" }, { status: 404 });
  }
}
