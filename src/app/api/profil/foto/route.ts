import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readJson, writeJson, User } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAKS_BYTE = 2 * 1024 * 1024;
const EKSTENSI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("foto");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File foto wajib diisi" }, { status: 400 });
  }
  const ext = EKSTENSI[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format foto harus JPG, PNG, atau WebP" },
      { status: 400 }
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAKS_BYTE) {
    return NextResponse.json({ error: "Ukuran foto maks 2 MB" }, { status: 400 });
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  // Hapus foto lama user ini (ekstensi apa pun) supaya tidak menumpuk.
  const lama = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
  for (const f of lama.filter((n) => n.startsWith(s.user.id + "."))) {
    await fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => undefined);
  }
  const namaFile = `${s.user.id}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, namaFile), buf);
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === s.user.id);
  if (user) {
    user.foto = `/api/foto/${namaFile}`;
    await writeJson("users.json", users);
  }
  return NextResponse.json({ foto: `/api/foto/${namaFile}` });
}
