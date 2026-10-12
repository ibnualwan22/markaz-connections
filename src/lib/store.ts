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
  ikon: string;
  kategori: string;
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
}

export type Grants = Record<string, string[]>;
