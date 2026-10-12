"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { NAMA_IKON } from "@/lib/ikon";
import TombolKeluar from "../dashboard/TombolKeluar";

interface User {
  id: string;
  username: string;
  nama: string;
  peran: string;
  aktif: boolean;
}
interface App {
  id: string;
  nama: string;
  url: string;
  deskripsi: string;
  ikon: string;
  kategori: string;
}

export default function Admin() {
  const [tab, setTab] = useState<"user" | "app" | "akses">("user");
  const [users, setUsers] = useState<User[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [grants, setGrants] = useState<Record<string, string[]>>({});

  const [uBaru, setUBaru] = useState({ username: "", nama: "", password: "", peran: "staff" });
  const [aBaru, setABaru] = useState({ nama: "", url: "", deskripsi: "", ikon: "Globe", kategori: "" });
  const [pesan, setPesan] = useState("");

  async function muat() {
    const [ru, ra, rg] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/apps").then((r) => r.json()),
      fetch("/api/admin/grants").then((r) => r.json()),
    ]);
    setUsers(ru.users || []);
    setApps(ra.apps || []);
    setGrants(rg.grants || {});
  }

  useEffect(() => {
    muat();
  }, []);

  function info(t: string) {
    setPesan(t);
    setTimeout(() => setPesan(""), 3000);
  }

  async function tambahUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uBaru),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setUBaru({ username: "", nama: "", password: "", peran: "staff" });
    muat();
    info("User ditambahkan");
  }

  async function toggleAktif(u: User) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, aktif: !u.aktif }),
    });
    muat();
  }

  async function resetPw(u: User) {
    const pw = prompt(`Password baru untuk ${u.username}:`);
    if (!pw) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, password: pw }),
    });
    info("Password direset");
  }

  async function tambahApp(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aBaru),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setABaru({ nama: "", url: "", deskripsi: "", ikon: "Globe", kategori: "" });
    muat();
    info("Website ditambahkan");
  }

  async function hapusApp(id: string, nama: string) {
    if (!confirm(`Hapus "${nama}" dari direktori?`)) return;
    await fetch(`/api/admin/apps?id=${id}`, { method: "DELETE" });
    muat();
  }

  async function toggleGrant(userId: string, appId: string, allow: boolean) {
    setGrants((g) => {
      const s = new Set(g[userId] || []);
      if (allow) s.add(appId);
      else s.delete(appId);
      return { ...g, [userId]: [...s] };
    });
    await fetch("/api/admin/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, appId, allow }),
    });
  }

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg ${
        tab === id
          ? "bg-emerald-700 text-white"
          : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );

  const input = "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div className="font-bold text-lg">
              Bawwabah <span className="text-stone-400 font-normal text-sm">/ Admin</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-stone-600 hover:text-emerald-700 px-3 py-2">
              Dasbor
            </Link>
            <TombolKeluar />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {tabBtn("user", "Pengguna")}
          {tabBtn("app", "Website")}
          {tabBtn("akses", "Akses")}
        </div>

        {pesan && (
          <p className="mb-4 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2">
            {pesan}
          </p>
        )}

        {tab === "user" && (
          <div className="grid md:grid-cols-3 gap-6">
            <form onSubmit={tambahUser} className="bg-white border border-stone-200 rounded-xl p-5 h-fit">
              <h3 className="font-semibold mb-3 flex items-center gap-1.5">
                <Plus size={16} /> Tambah Pengguna
              </h3>
              <div className="space-y-3">
                <input className={input} placeholder="Username" value={uBaru.username} onChange={(e) => setUBaru({ ...uBaru, username: e.target.value })} required />
                <input className={input} placeholder="Nama lengkap" value={uBaru.nama} onChange={(e) => setUBaru({ ...uBaru, nama: e.target.value })} required />
                <input className={input} type="password" placeholder="Password" value={uBaru.password} onChange={(e) => setUBaru({ ...uBaru, password: e.target.value })} required />
                <select className={input} value={uBaru.peran} onChange={(e) => setUBaru({ ...uBaru, peran: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                <button className="w-full bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">
                  Tambah
                </button>
              </div>
            </form>
            <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Nama</th>
                    <th className="px-4 py-2.5 font-medium">Username</th>
                    <th className="px-4 py-2.5 font-medium">Peran</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-stone-100">
                      <td className="px-4 py-2.5">{u.nama}</td>
                      <td className="px-4 py-2.5 text-stone-500">@{u.username}</td>
                      <td className="px-4 py-2.5">{u.peran}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.aktif ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                          {u.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 space-x-2">
                        <button onClick={() => toggleAktif(u)} className="text-xs text-stone-600 hover:text-emerald-700 underline">
                          {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button onClick={() => resetPw(u)} className="text-xs text-stone-600 hover:text-emerald-700 underline">
                          Reset PW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "app" && (
          <div className="grid md:grid-cols-3 gap-6">
            <form onSubmit={tambahApp} className="bg-white border border-stone-200 rounded-xl p-5 h-fit">
              <h3 className="font-semibold mb-3 flex items-center gap-1.5">
                <Plus size={16} /> Tambah Website
              </h3>
              <div className="space-y-3">
                <input className={input} placeholder="Nama website" value={aBaru.nama} onChange={(e) => setABaru({ ...aBaru, nama: e.target.value })} required />
                <input className={input} placeholder="https://..." value={aBaru.url} onChange={(e) => setABaru({ ...aBaru, url: e.target.value })} required />
                <input className={input} placeholder="Deskripsi singkat" value={aBaru.deskripsi} onChange={(e) => setABaru({ ...aBaru, deskripsi: e.target.value })} />
                <input className={input} placeholder="Kategori" value={aBaru.kategori} onChange={(e) => setABaru({ ...aBaru, kategori: e.target.value })} />
                <select className={input} value={aBaru.ikon} onChange={(e) => setABaru({ ...aBaru, ikon: e.target.value })}>
                  {NAMA_IKON.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button className="w-full bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-800">
                  Tambah
                </button>
              </div>
            </form>
            <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Nama</th>
                    <th className="px-4 py-2.5 font-medium">URL</th>
                    <th className="px-4 py-2.5 font-medium">Kategori</th>
                    <th className="px-4 py-2.5 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-t border-stone-100">
                      <td className="px-4 py-2.5">{a.nama}</td>
                      <td className="px-4 py-2.5 text-stone-500 truncate max-w-[220px]">{a.url}</td>
                      <td className="px-4 py-2.5">{a.kategori}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => hapusApp(a.id, a.nama)} className="text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "akses" && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium sticky left-0 bg-stone-50">Pengguna</th>
                  {apps.map((a) => (
                    <th key={a.id} className="px-3 py-2.5 font-medium text-center whitespace-nowrap">{a.nama}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-stone-100">
                    <td className="px-4 py-2.5 sticky left-0 bg-white">
                      {u.nama} <span className="text-stone-400 text-xs">@{u.username}</span>
                    </td>
                    {apps.map((a) => (
                      <td key={a.id} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-700"
                          checked={(grants[u.id] || []).includes(a.id)}
                          onChange={(e) => toggleGrant(u.id, a.id, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-stone-500 px-4 py-3 border-t border-stone-100">
              Centang = pengguna boleh melihat & membuka website tersebut di dasbornya.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
