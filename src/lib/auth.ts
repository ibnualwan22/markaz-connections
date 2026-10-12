import * as jose from "jose";
import bcrypt from "bcryptjs";

export const COOKIE_NAME = "bawwabah_session";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET || "dev-secret-ganti-di-production";
  return new TextEncoder().encode(s);
}

export interface TokenPayload {
  sub: string;
  username: string;
  nama: string;
  peran: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
