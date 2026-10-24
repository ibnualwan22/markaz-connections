import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { readJson, writeJson, User } from "@/lib/store";
import { requireSuperadmin } from "@/lib/session";
import { appendAudit } from "@/lib/audit";

const tanpaHash = (u: User) => {
  const { passwordHash: _h, ...rest } = u;
  return rest;
};

const CIVITAS_FIELD = [
  "email",
  "alamat",
  "tempat_lahir",
  "tanggal_lahir",
  "pendidikan_terakhir",
  "jabatan",
  "no_wa",
] as const;

export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const users = await readJson<User[]>("users.json", []);
  return NextResponse.json({ users: users.map(tanpaHash) });
}

export async function POST(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { username, nama, password, peran } = await req.json();
  if (!username || !nama || !password)
    return NextResponse.json(
      { error: "Username, nama, dan password wajib diisi" },
      { status: 400 }
    );

  // Hanya owner yang boleh membuat superadmin. is_owner tidak pernah
  // bisa disetel lewat API.
  const mauSuperadmin = peran === "superadmin";
  if (mauSuperadmin && !s.user.is_owner) {
    return NextResponse.json(
      { error: "Hanya owner yang boleh membuat superadmin." },
      { status: 403 }
    );
  }

  const users = await readJson<User[]>("users.json", []);
  if (
    users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())
  )
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });

  const user: User = {
    id: "u-" + Date.now().toString(36),
    username: String(username).toLowerCase(),
    nama: String(nama),
    email: "",
    foto: "",
    peran: mauSuperadmin ? "superadmin" : peran === "admin" ? "admin" : "staff",
    tipe: "staff",
    aktif: true,
    passwordHash: await hashPassword(String(password)),
  };
  users.push(user);
  await writeJson("users.json", users);
  await appendAudit({
    aktorId: s.user.id,
    aktorUsername: s.user.username,
    aksi: "buat_user",
    targetId: user.id,
    detail: `username=${user.username} peran=${user.peran}`,
  });
  return NextResponse.json({ user: tanpaHash(user) });
}

export async function PATCH(req: Request) {
  const s = await requireSuperadmin();
  if (!s)
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const body = await req.json();
  const { id, aktif, password, peran } = body;
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === id);
  if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });

  // Akun owner hanya boleh diubah oleh owner sendiri.
  if (user.is_owner && !s.user.is_owner) {
    return NextResponse.json(
      { error: "Akun owner hanya boleh diubah owner." },
      { status: 403 }
    );
  }

  const aksi: string[] = [];
  if (typeof aktif === "boolean" && aktif !== user.aktif) {
    user.aktif = aktif;
    aksi.push("ubah_status");
  }
  if (password) {
    user.passwordHash = await hashPassword(String(password));
    aksi.push("reset_password");
  }
  if (peran && peran !== user.peran) {
    // Perubahan peran ke/dari superadmin hanya oleh owner.
    if (!s.user.is_owner) {
      return NextResponse.json(
        { error: "Hanya owner yang boleh mengubah peran superadmin." },
        { status: 403 }
      );
    }
    if (peran !== "superadmin" && peran !== "admin" && peran !== "staff") {
      return NextResponse.json({ error: "Peran tidak dikenal" }, { status: 400 });
    }
    // Owner tidak boleh menurunkan dirinya sendiri lewat endpoint ini.
    if (user.is_owner && peran !== "superadmin") {
      return NextResponse.json(
        { error: "Owner tidak bisa diturunkan perannya." },
        { status: 403 }
      );
    }
    user.peran = peran;
    aksi.push("ubah_peran");
  }
  for (const f of CIVITAS_FIELD) {
    if (body[f] !== undefined && body[f] !== user[f]) {
      user[f] = String(body[f]);
      if (!aksi.includes("ubah_civitas")) aksi.push("ubah_civitas");
    }
  }

  await writeJson("users.json", users);
  for (const a of aksi) {
    await appendAudit({
      aktorId: s.user.id,
      aktorUsername: s.user.username,
      aksi: a,
      targetId: user.id,
      detail: `username=${user.username}`,
    });
  }
  return NextResponse.json({ user: tanpaHash(user) });
}
