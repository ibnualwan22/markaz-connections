import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";
import { getSessionUser } from "@/lib/session";

// Manajemen periode (Fase 4; hanya superadmin).
// Pagar server di sini (middleware tidak diubah — mengikuti perilaku
// halaman admin lain: belum login -> /login?next=..., bukan superadmin
// -> /dashboard). API periode juga menolak non-superadmin (403).
export default async function PeriodePage() {
  const s = await getSessionUser();
  if (!s) redirect("/login?next=/periode");
  if (s.user.peran !== "superadmin") redirect("/dashboard");
  return <AdminPanel tab="periode" />;
}
