import AdminPanel from "@/components/admin/AdminPanel";

// Kelola role bundel website (pecahan halaman admin; hanya superadmin —
// dijaga middleware).
export default function RolePage() {
  return <AdminPanel tab="role" />;
}
