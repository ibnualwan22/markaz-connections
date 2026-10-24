"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function TombolKeluar() {
  const router = useRouter();

  async function keluar() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={keluar}
      className="inline-flex items-center gap-1.5 bg-white/80 border border-sky-200 text-sm font-semibold text-slate-600 hover:text-red-600 px-4 py-2 rounded-full shadow-sm transition"
    >
      <LogOut size={16} /> Keluar
    </button>
  );
}
