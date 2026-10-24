"use client";

// Sidebar global Bawwabah: navigasi Dashboard / Profil / Admin (superadmin
// saja) + kartu user di atas + tombol Keluar di bawah. Desktop: sidebar
// permanen di kiri. Mobile: drawer hamburger (sidebar permanen akan memakan
// layar kecil).
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarUser {
  nama: string;
  username: string;
  foto: string;
  peran: string;
}

export default function SidebarNav({ user }: { user: SidebarUser }) {
  const [buka, setBuka] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const inisial = user.nama
    .split(" ")
    .map((k) => k[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const menu = [
    { href: "/dashboard", label: "Dashboard", ikon: LayoutDashboard },
    { href: "/profil", label: "Profil", ikon: User },
    ...(user.peran === "superadmin"
      ? [{ href: "/admin", label: "Admin", ikon: ShieldCheck }]
      : []),
  ];

  async function keluar() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isi = (
    <div className="flex flex-col h-full">
      <Link
        href="/profil"
        onClick={() => setBuka(false)}
        className="flex items-center gap-3 px-5 py-5 border-b border-sky-100"
      >
        {user.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.foto}
            alt={user.nama}
            className="w-11 h-11 rounded-full object-cover border-2 border-sky-200 shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {inisial}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">
            {user.nama}
          </p>
          <p className="text-xs text-slate-500 truncate">@{user.username}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold bg-sky-50 text-blue-700 border border-sky-200 rounded-full px-2 py-0.5">
            {user.peran === "superadmin"
              ? "Superadmin"
              : user.peran === "admin"
                ? "Admin"
                : "Staff"}
          </span>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((m) => {
          const aktif = pathname === m.href;
          const Ikon = m.ikon;
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setBuka(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                aktif
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              <Ikon size={18} /> {m.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sky-100">
        <button
          onClick={keluar}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-white/80 border border-sky-200 text-sm font-semibold text-slate-600 hover:text-red-600 px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: tombol hamburger + drawer */}
      <button
        onClick={() => setBuka(true)}
        aria-label="Buka menu"
        className="md:hidden fixed top-4 left-4 z-40 bg-white/90 border border-sky-200 rounded-full p-2.5 shadow-md text-slate-700"
      >
        <Menu size={20} />
      </button>
      {buka && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setBuka(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button
              onClick={() => setBuka(false)}
              aria-label="Tutup menu"
              className="absolute top-4 right-4 text-slate-500 z-10"
            >
              <X size={20} />
            </button>
            {isi}
          </div>
        </div>
      )}
      {/* Desktop: sidebar permanen */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 bg-white/80 backdrop-blur-sm border-r border-sky-100 z-30">
        {isi}
      </aside>
    </>
  );
}
