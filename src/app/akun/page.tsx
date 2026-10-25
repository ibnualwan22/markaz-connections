import AdminPanel from "@/components/admin/AdminPanel";

// Kelola akun pengguna (pecahan halaman admin; hanya superadmin — dijaga
// middleware).
export default function AkunPage() {
  return <AdminPanel tab="user" />;
}
