import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function readJson<T>(nama: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, nama), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(nama: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, nama), JSON.stringify(data, null, 2));
}

export interface App {
  id: string;
  nama: string;
  deskripsi: string;
  url: string;
  logo: string;
  ikon: string;
  kategori: string;
  status?: string;
}

export interface User {
  id: string;
  username: string;
  nama: string;
  email: string;
  foto: string;
  peran: "superadmin" | "admin" | "staff";
  tipe: "staff" | "santri";
  aktif: boolean;
  passwordHash: string;
  // Fase 1 Bawwabah: hanya satu owner; hanya owner yang boleh mengangkat
  // superadmin. Label peran owner tetap "superadmin".
  is_owner?: boolean;
  // Tautan ke akun Siakad asal (id User Siakad), bila ada.
  siakadId?: string;
  // Data civitas (diisi lewat profil / halaman admin).
  alamat?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  pendidikan_terakhir?: string;
  jabatan?: string;
  no_wa?: string;
}

export type Grants = Record<string, string[]>;

// Fase 2: role = bundel akses web (menentukan tile dashboard).
// Role TIDAK memberi izin di dalam web — itu wewenang admin tiap web.
export interface Role {
  id: string;
  nama: string;
  apps: string[];
}

// userId -> daftar id role.
export type UserRoles = Record<string, string[]>;

export interface AuditEntry {
  waktu: string;
  aktorId: string;
  aktorUsername: string;
  aksi: string;
  targetId?: string;
  detail?: string;
}

export interface OtpEntry {
  userId: string;
  kodeHash: string;
  dibuatPada: number;
  kedaluwarsaPada: number;
  percobaan: number;
  permintaanTerakhir: number;
}
