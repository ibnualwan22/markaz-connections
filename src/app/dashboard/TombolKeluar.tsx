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
      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-red-600 px-3 py-2"
    >
      <LogOut size={16} /> Keluar
    </button>
  );
}
