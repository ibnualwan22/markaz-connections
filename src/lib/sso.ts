// Server-only: membuat token SSO sekali pakai (pola yang sama dengan SSO
// Siakad→E-Maliyah: payload base64url + HMAC-SHA256 hex, berlaku 120 detik).
import { createHmac, randomUUID } from "crypto";

export function createSsoToken(
  siakadId: string,
  aud: string,
  secret: string,
  extra?: { username?: string; superadmin?: boolean }
): string {
  const payload = {
    siakad_id: siakadId,
    ...(extra?.username ? { username: extra.username } : {}),
    ...(extra?.superadmin ? { superadmin: true } : {}),
    aud,
    exp: Math.floor(Date.now() / 1000) + 120,
    jti: randomUUID(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}
