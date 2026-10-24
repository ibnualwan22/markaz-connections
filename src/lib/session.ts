// Helper sesi sisi server (route handler saja, BUKAN middleware: file ini
// memakai fs lewat store, dan middleware berjalan di edge tanpa fs).
// Penting: peran/is_owner/aktif selalu dibaca ulang dari users.json, BUKAN
// dari klaim token — supaya demosi/nonaktif langsung berlaku meski token
// 12 jam masih hidup.
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./auth";
import { readJson, User } from "./store";

export interface SessionUser {
  payload: { sub: string; username: string; nama: string; peran: string };
  user: User;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const users = await readJson<User[]>("users.json", []);
  const user = users.find((u) => u.id === payload.sub && u.aktif);
  if (!user) return null;
  return { payload, user };
}

export async function requireSuperadmin(): Promise<SessionUser | null> {
  const s = await getSessionUser();
  if (!s || s.user.peran !== "superadmin") return null;
  return s;
}

export async function requireOwner(): Promise<SessionUser | null> {
  const s = await getSessionUser();
  if (!s || !s.user.is_owner) return null;
  return s;
}
