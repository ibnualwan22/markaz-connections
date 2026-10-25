import AdminPanel from "@/components/admin/AdminPanel";

// Log audit (pecahan halaman admin; hanya superadmin — dijaga middleware).
export default function AuditPage() {
  return <AdminPanel tab="audit" />;
}
