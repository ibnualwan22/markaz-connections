import { NextResponse } from "next/server";
import { readJson, AuditEntry } from "@/lib/store";
import { requireSuperadmin } from "@/lib/session";

export async function GET() {
  if (!(await requireSuperadmin()))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const list = await readJson<AuditEntry[]>("audit.json", []);
  return NextResponse.json({ audit: [...list].reverse().slice(0, 200) });
}
