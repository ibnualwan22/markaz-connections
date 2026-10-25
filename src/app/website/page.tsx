import AdminPanel from "@/components/admin/AdminPanel";

// Kelola direktori website (pecahan halaman admin; hanya superadmin —
// dijaga middleware).
export default function WebsitePage() {
  return <AdminPanel tab="app" />;
}
