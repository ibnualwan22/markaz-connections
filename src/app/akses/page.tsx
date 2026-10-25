import AdminPanel from "@/components/admin/AdminPanel";

// Matriks hak akses per pengguna (pecahan halaman admin; hanya superadmin
// — dijaga middleware).
export default function AksesPage() {
  return <AdminPanel tab="akses" />;
}
