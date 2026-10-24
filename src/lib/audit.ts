import { readJson, writeJson, AuditEntry } from "./store";

const MAKS = 1000;

export async function appendAudit(entry: Omit<AuditEntry, "waktu">): Promise<void> {
  const list = await readJson<AuditEntry[]>("audit.json", []);
  list.push({ ...entry, waktu: new Date().toISOString() });
  await writeJson("audit.json", list.slice(-MAKS));
}
