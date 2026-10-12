import {
  GraduationCap,
  ClipboardList,
  Users,
  Wallet,
  BarChart3,
  Handshake,
  KanbanSquare,
  Globe,
  LayoutGrid,
} from "lucide-react";

const DAFTAR: Record<string, typeof Globe> = {
  GraduationCap,
  ClipboardList,
  Users,
  Wallet,
  BarChart3,
  Handshake,
  KanbanSquare,
  LayoutGrid,
  Globe,
};

export const NAMA_IKON = Object.keys(DAFTAR);

export function Ikon({ nama, className }: { nama: string; className?: string }) {
  const C = DAFTAR[nama] || Globe;
  return <C className={className} />;
}
