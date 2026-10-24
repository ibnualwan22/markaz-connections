"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { NAMA_IKON } from "@/lib/ikon";
import HexBackground from "@/lib/HexBackground";

interface User {
  id: string;
  username: string;
  nama: string;
  peran: string;
  aktif: boolean;
  is_owner?: boolean;
  email?: string;
  alamat?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  pendidikan_terakhir?: string;
  jabatan?: string;
  no_wa?: string;
}
interface Role {
  id: string;
  nama: string;
  apps: string[];
}
interface Audit {
  waktu: string;
  aktorUsername: string;
  aksi: string;
  targetId?: string;
  detail?: string;
}
interface App {
  id: string;
  nama: string;
  url: string;
  logo: string;
  deskripsi: string;
  ikon: string;
  kategori: string;
  status?: string;
}

export default function Admin() {
  const [tab, setTab] = useState<"user" | "app" | "akses" | "audit" | "role">("user");
  const [users, setUsers] = useState<User[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [grants, setGrants] = useState<Record<string, string[]>>({});
  const [saya, setSaya] = useState<User | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [rBaru, setRBaru] = useState({ nama: "", apps: [] as string[] });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const [uBaru, setUBaru] = useState({ username: "", nama: "", password: "", peran: "staff" });
  const [aBaru, setABaru] = useState({ nama: "", url: "", deskripsi: "", logo: "", ikon: "Globe", kategori: "" });
  const [editApp, setEditApp] = useState<App | null>(null);
  const [editAppForm, setEditAppForm] = useState({ nama: "", url: "", deskripsi: "", logo: "", ikon: "Globe", kategori: "", status: "" });
  const [pesan, setPesan] = useState("");

  async function muat() {
    const [ru, ra, rg, rm, rad, rr, rur] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/apps").then((r) => r.json()),
      fetch("/api/admin/grants").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/admin/audit").then((r) => r.json()),
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/user-roles").then((r) => r.json()),
    ]);
    setUsers(ru.users || []);
    setApps(ra.apps || []);
    setGrants(rg.grants || {});
    setSaya(rm.user || null);
    setAudit(rad.audit || []);
    setRoles(rr.roles || []);
    setUserRoles(rur.userRoles || {});
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
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, aktif: !u.aktif }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    muat();
  }

  async function resetPw(u: User) {
    const pw = prompt(`Password baru untuk ${u.username}:`);
    if (!pw) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, password: pw }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    info("Password direset");
  }

  async function tambahRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rBaru),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setRBaru({ nama: "", apps: [] });
    muat();
    info("Role ditambahkan");
  }

  async function hapusRole(id: string, nama: string) {
    if (!confirm(`Hapus role "${nama}"? Penugasan role ini ke semua user ikut dicabut.`)) return;
    await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
    muat();
  }

  function bukaEdit(u: User) {
    setEditUser(u);
    setEditForm({
      nama: u.nama || "",
      email: u.email || "",
      alamat: u.alamat || "",
      tempat_lahir: u.tempat_lahir || "",
      tanggal_lahir: u.tanggal_lahir || "",
      pendidikan_terakhir: u.pendidikan_terakhir || "",
      jabatan: u.jabatan || "",
      no_wa: u.no_wa || "",
      peran: u.peran || "staff",
    });
    setEditRoles(userRoles[u.id] || []);
  }

  async function simpanEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editUser.id, ...editForm }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    const res2 = await fetch("/api/admin/user-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editUser.id, roleIds: editRoles }),
    });
    const data2 = await res2.json().catch(() => ({}));
    if (!res2.ok) return info("Gagal: " + (data2.error || "ditolak"));
    setEditUser(null);
    muat();
    info("Pengguna diperbarui");
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
    setABaru({ nama: "", url: "", deskripsi: "", logo: "", ikon: "Globe", kategori: "" });
    muat();
    info("Website ditambahkan");
  }

  async function hapusApp(id: string, nama: string) {
    if (!confirm(`Hapus "${nama}" dari direktori?`)) return;
    await fetch(`/api/admin/apps?id=${id}`, { method: "DELETE" });
    muat();
  }

  async function simpanEditApp(e: React.FormEvent) {
    e.preventDefault();
    if (!editApp) return;
    const res = await fetch("/api/admin/apps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editApp.id, ...editAppForm }),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setEditApp(null);
    muat();
    info("Website diperbarui");
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
      className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
        tab === id
          ? "bg-blue-700 text-white shadow-lg shadow-blue-600/25"
          : "text-slate-600 hover:bg-white/70"
      }`}
    >
      {label}
    </button>
  );

  const input =
    "w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-600";
  const kartu = "bg-white/75 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-xl shadow-sky-200/40";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-1">
          Admin Bawwabah
        </h1>
        <p className="text-sm text-blue-800/60 font-medium mb-6">
          Kelola pengguna, website, dan hak akses ekosistem
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabBtn("user", "Pengguna")}
          {tabBtn("app", "Website")}
          {tabBtn("akses", "Akses")}
          {tabBtn("role", "Role")}
          {tabBtn("audit", "Audit")}
        </div>

        {pesan && (
          <p className="mb-4 text-sm bg-sky-50 border border-sky-200 text-blue-700 rounded-xl px-3 py-2">
            {pesan}
          </p>
        )}

        {tab === "user" && editUser && (
          <form onSubmit={simpanEdit} className={`${kartu} p-5 mb-6`}>
            <h3 className="font-bold text-slate-800 mb-3">Edit {editUser.username}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["nama", "Nama lengkap"],
                ["email", "Email"],
                ["no_wa", "No WA aktif"],
                ["alamat", "Alamat lengkap"],
                ["tempat_lahir", "Tempat lahir"],
                ["tanggal_lahir", "Tanggal lahir"],
                ["pendidikan_terakhir", "Pendidikan terakhir"],
                ["jabatan", "Jabatan"],
              ].map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                  <input
                    className={input}
                    type={k === "tanggal_lahir" ? "date" : "text"}
                    value={editForm[k] || ""}
                    onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Peran</span>
                <select className={input} value={editForm.peran || "staff"} onChange={(e) => setEditForm({ ...editForm, peran: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  {saya?.is_owner && <option value="superadmin">Superadmin</option>}
                </select>
              </label>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-4 mb-2">Role (bundel website)</p>
            <div className="flex flex-wrap gap-3">
              {roles.map((r) => (
                <label key={r.id} className="text-sm text-slate-700 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-700"
                    checked={editRoles.includes(r.id)}
                    onChange={(e) =>
                      setEditRoles(e.target.checked ? [...editRoles, r.id] : editRoles.filter((x) => x !== r.id))
                    }
                  />
                  {r.nama}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="bg-gradient-to-r from-blue-700 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                Simpan
              </button>
              <button type="button" onClick={() => setEditUser(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white/70">
                Batal
              </button>
            </div>
          </form>
        )}

        {tab === "user" && (
          <div className="grid md:grid-cols-3 gap-6">
            <form onSubmit={tambahUser} className={`${kartu} p-5 h-fit`}>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Plus size={16} /> Tambah Pengguna
              </h3>
              <div className="space-y-3">
                <input className={input} placeholder="Username" value={uBaru.username} onChange={(e) => setUBaru({ ...uBaru, username: e.target.value })} required />
                <input className={input} placeholder="Nama lengkap" value={uBaru.nama} onChange={(e) => setUBaru({ ...uBaru, nama: e.target.value })} required />
                <input className={input} type="password" placeholder="Password" value={uBaru.password} onChange={(e) => setUBaru({ ...uBaru, password: e.target.value })} required />
                <select className={input} value={uBaru.peran} onChange={(e) => setUBaru({ ...uBaru, peran: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  {saya?.is_owner && <option value="superadmin">Superadmin</option>}
                </select>
                {!saya?.is_owner && (
                  <p className="text-xs text-slate-500">Hanya owner yang boleh membuat superadmin.</p>
                )}
                <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                  Tambah
                </button>
              </div>
            </form>
            <div className={`md:col-span-2 ${kartu} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-sky-50/70 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Nama</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Username</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Peran</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-sky-100/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{u.nama}</td>
                      <td className="px-4 py-2.5 text-slate-500">@{u.username}</td>
                      <td className="px-4 py-2.5 text-slate-600">{u.peran}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.aktif ? "bg-sky-50 text-blue-700 border border-sky-200" : "bg-slate-100 text-slate-500"}`}>
                          {u.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 space-x-2">
                        {u.is_owner && <span className="text-xs font-semibold text-amber-700">Owner</span>}
                        <button onClick={() => bukaEdit(u)} className="text-xs text-blue-600 hover:text-blue-800 underline">
                          Edit
                        </button>
                        {(!u.is_owner || saya?.is_owner) && (
                          <>
                            <button onClick={() => toggleAktif(u)} className="text-xs text-blue-600 hover:text-blue-800 underline">
                              {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button onClick={() => resetPw(u)} className="text-xs text-blue-600 hover:text-blue-800 underline">
                              Reset PW
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "app" && (
          <>
            {editApp && (
              <form onSubmit={simpanEditApp} className={`${kartu} p-5 mb-6`}>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Pencil size={16} /> Edit Website: {editApp.nama}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className={input} placeholder="Nama website" value={editAppForm.nama} onChange={(e) => setEditAppForm({ ...editAppForm, nama: e.target.value })} required />
                  <input className={input} placeholder="https://... (kosongkan = Coming Soon)" value={editAppForm.url} onChange={(e) => setEditAppForm({ ...editAppForm, url: e.target.value })} />
                  <input className={input} placeholder="Path logo, mis. /images/logo-x.png" value={editAppForm.logo} onChange={(e) => setEditAppForm({ ...editAppForm, logo: e.target.value })} />
                  <input className={input} placeholder="Deskripsi singkat" value={editAppForm.deskripsi} onChange={(e) => setEditAppForm({ ...editAppForm, deskripsi: e.target.value })} />
                  <input className={input} placeholder="Kategori" value={editAppForm.kategori} onChange={(e) => setEditAppForm({ ...editAppForm, kategori: e.target.value })} />
                  <input className={input} placeholder="Status (mis. Coming Soon)" value={editAppForm.status} onChange={(e) => setEditAppForm({ ...editAppForm, status: e.target.value })} />
                  <select className={input} value={editAppForm.ikon} onChange={(e) => setEditAppForm({ ...editAppForm, ikon: e.target.value })}>
                    {NAMA_IKON.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                {editAppForm.url !== editApp.url && (
                  <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    URL berubah — tujuan tile dashboard ikut berubah.
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                    Simpan
                  </button>
                  <button type="button" onClick={() => setEditApp(null)} className="flex-1 border border-sky-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/70">
                    Batal
                  </button>
                </div>
              </form>
            )}
            <div className="grid md:grid-cols-3 gap-6">
            <form onSubmit={tambahApp} className={`${kartu} p-5 h-fit`}>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Plus size={16} /> Tambah Website
              </h3>
              <div className="space-y-3">
                <input className={input} placeholder="Nama website" value={aBaru.nama} onChange={(e) => setABaru({ ...aBaru, nama: e.target.value })} required />
                <input className={input} placeholder="https://... (kosongkan = Coming Soon)" value={aBaru.url} onChange={(e) => setABaru({ ...aBaru, url: e.target.value })} />
                <input className={input} placeholder="Path logo, mis. /images/logo-x.png" value={aBaru.logo} onChange={(e) => setABaru({ ...aBaru, logo: e.target.value })} />
                <input className={input} placeholder="Deskripsi singkat" value={aBaru.deskripsi} onChange={(e) => setABaru({ ...aBaru, deskripsi: e.target.value })} />
                <input className={input} placeholder="Kategori" value={aBaru.kategori} onChange={(e) => setABaru({ ...aBaru, kategori: e.target.value })} />
                <select className={input} value={aBaru.ikon} onChange={(e) => setABaru({ ...aBaru, ikon: e.target.value })}>
                  {NAMA_IKON.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                  Tambah
                </button>
              </div>
            </form>
            <div className={`md:col-span-2 ${kartu} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-sky-50/70 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Nama</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">URL</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Kategori</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-t border-sky-100/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{a.nama}</td>
                      <td className="px-4 py-2.5 text-slate-500 truncate max-w-[220px]">{a.url || "Coming Soon"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.kategori}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <button
                            title="Edit website"
                            onClick={() => {
                              setEditApp(a);
                              setEditAppForm({ nama: a.nama, url: a.url || "", deskripsi: a.deskripsi || "", logo: a.logo || "", ikon: a.ikon || "Globe", kategori: a.kategori || "", status: a.status || "" });
                            }}
                            className="text-blue-700 hover:text-blue-800"
                          >
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => hapusApp(a.id, a.nama)} className="text-red-600 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </>
        )}

        {tab === "akses" && (
          <div className={`${kartu} overflow-x-auto`}>
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-sky-50/70">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 sticky left-0 bg-sky-50/70">Pengguna</th>
                  {apps.map((a) => (
                    <th key={a.id} className="px-3 py-2.5 font-semibold text-slate-700 text-center whitespace-nowrap">{a.nama}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-sky-100/60">
                    <td className="px-4 py-2.5 sticky left-0 bg-white/75 font-medium text-slate-800">
                      {u.nama} <span className="text-slate-400 text-xs font-normal">@{u.username}</span>
                    </td>
                    {apps.map((a) => (
                      <td key={a.id} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-700"
                          checked={(grants[u.id] || []).includes(a.id)}
                          onChange={(e) => toggleGrant(u.id, a.id, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 px-4 py-3 border-t border-sky-100/60">
              Centang = pengguna boleh melihat & membuka website tersebut di dasbornya.
            </p>
          </div>
        )}

        {tab === "audit" && (
          <div className={`${kartu} overflow-x-auto`}>
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-sky-50/70 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Aktor</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Aksi</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700">Detail</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a, i) => (
                  <tr key={i} className="border-t border-sky-100/60">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{new Date(a.waktu).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">@{a.aktorUsername}</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.aksi}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.detail || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audit.length === 0 && (
              <p className="text-sm text-slate-500 px-4 py-6 text-center">Belum ada aktivitas tercatat.</p>
            )}
          </div>
        )}

        {tab === "role" && (
          <div className="grid md:grid-cols-3 gap-6">
            <form onSubmit={tambahRole} className={`${kartu} p-5 h-fit`}>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Plus size={16} /> Tambah Role
              </h3>
              <div className="space-y-3">
                <input className={input} placeholder="Nama role" value={rBaru.nama} onChange={(e) => setRBaru({ ...rBaru, nama: e.target.value })} required />
                <p className="text-xs font-semibold text-slate-600">Website dalam role ini:</p>
                <div className="space-y-1.5">
                  {apps.map((a) => (
                    <label key={a.id} className="text-sm text-slate-700 flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-700"
                        checked={rBaru.apps.includes(a.id)}
                        onChange={(e) =>
                          setRBaru({
                            ...rBaru,
                            apps: e.target.checked ? [...rBaru.apps, a.id] : rBaru.apps.filter((x) => x !== a.id),
                          })
                        }
                      />
                      {a.nama}
                    </label>
                  ))}
                </div>
                <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                  Tambah
                </button>
              </div>
            </form>
            <div className={`md:col-span-2 ${kartu} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-sky-50/70 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Role</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Website</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Pengguna</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} className="border-t border-sky-100/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.nama}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {r.apps.map((id) => apps.find((a) => a.id === id)?.nama || id).join(", ") || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {Object.values(userRoles).filter((ids) => ids.includes(r.id)).length}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => hapusRole(r.id, r.nama)} className="text-red-600 hover:text-red-700">
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
      </div>
    </main>
  );
}
