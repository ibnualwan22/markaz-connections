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
interface Period {
  id: string;
  namaDufah: string;
  noDufah: number;
  noMarhalah: number;
  noNukhbah: number;
  tanggalBuka: string;
  tanggalTutup: string;
  isTahunBaru: boolean;
  usbu1StartDate: string | null;
  usbu1EndDate: string | null;
  usbu2StartDate: string | null;
  usbu2EndDate: string | null;
  usbu3StartDate: string | null;
  usbu3EndDate: string | null;
  isCurrent: boolean;
  activatedAt: string | null;
  activatedByUsername: string | null;
  createdAt: string;
  createdByUsername: string;
  // Id baris Dufah di PPDB (null = draf belum tersinkron ke PPDB).
  ppdbDufahId: number | null;
}
interface NextNumbers {
  noDufah: number;
  noMarhalah: number;
  noNukhbah: number;
  namaDufah: string;
}

export type AdminTab = "user" | "app" | "akses" | "audit" | "role" | "periode";

const JUDUL_TAB: Record<AdminTab, string> = {
  user: "Akun",
  app: "Website",
  akses: "Akses",
  role: "Role",
  audit: "Audit",
  periode: "Periode",
};

// Panel admin: satu komponen untuk lima halaman pecahan (/akun, /website,
// /akses, /role, /audit). Halaman mana yang tampil ditentukan prop tab;
// navigasi antar halaman lewat sidebar (bukan tab di dalam halaman).
export default function AdminPanel({ tab }: { tab: AdminTab }) {
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

  // Periode (Fase 4): daftar + nomor berikutnya + form draf + dialog aktivasi.
  const [periods, setPeriods] = useState<Period[]>([]);
  const [nextInfo, setNextInfo] = useState<NextNumbers | null>(null);
  const [pBaru, setPBaru] = useState({
    namaDufah: "", tanggalBuka: "", tanggalTutup: "", isTahunBaru: false,
    usbu1StartDate: "", usbu1EndDate: "", usbu2StartDate: "", usbu2EndDate: "",
    usbu3StartDate: "", usbu3EndDate: "",
  });
  const [editDraft, setEditDraft] = useState<Period | null>(null);
  const [editDraftForm, setEditDraftForm] = useState({
    namaDufah: "", tanggalBuka: "", tanggalTutup: "", isTahunBaru: false,
    usbu1StartDate: "", usbu1EndDate: "", usbu2StartDate: "", usbu2EndDate: "",
    usbu3StartDate: "", usbu3EndDate: "",
  });
  const [konfirmasi, setKonfirmasi] = useState<Period | null>(null);
  const [terdampak, setTerdampak] = useState<number | null>(null);
  const [aktivasiError, setAktivasiError] = useState("");
  const [mengaktifkan, setMengaktifkan] = useState(false);
  const [menyinkronPpdb, setMenyinkronPpdb] = useState(false);

  // Fase 7: hasil propagasi aktivasi terakhir + status live + edit Usbu.
  const [propagasi, setPropagasi] = useState<any>(null);
  const [statusPropagasi, setStatusPropagasi] = useState<any>(null);
  const [memeriksaStatus, setMemeriksaStatus] = useState(false);
  const [editUsbu, setEditUsbu] = useState<Period | null>(null);
  const [editUsbuForm, setEditUsbuForm] = useState({
    usbu1StartDate: "", usbu1EndDate: "", usbu2StartDate: "", usbu2EndDate: "",
    usbu3StartDate: "", usbu3EndDate: "",
  });

  async function muat() {
    const [ru, ra, rg, rm, rad, rr, rur, rp, rs] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/apps").then((r) => r.json()),
      fetch("/api/admin/grants").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/admin/audit").then((r) => r.json()),
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/user-roles").then((r) => r.json()),
      // Periode: gagal muat (mis. DB mati) tidak boleh merusak panel lain.
      fetch("/api/admin/periods").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/periods/stats").then((r) => r.json()).catch(() => ({})),
    ]);
    setUsers(ru.users || []);
    setApps(ra.apps || []);
    setGrants(rg.grants || {});
    setSaya(rm.user || null);
    setAudit(rad.audit || []);
    setRoles(rr.roles || []);
    setUserRoles(rur.userRoles || {});
    setPeriods(rp.periods || []);
    setNextInfo(rp.next || null);
    setTerdampak(typeof rs.terdampak === "number" ? rs.terdampak : null);
  }

  useEffect(() => {
    muat();
  }, []);

  // Auto-isi nama dufah berikutnya saat form buat masih kosong.
  useEffect(() => {
    if (!nextInfo) return;
    const adaDraf = periods.some((p) => !p.activatedAt);
    if (!adaDraf && pBaru.namaDufah === "") {
      setPBaru((f) => (f.namaDufah === "" ? { ...f, namaDufah: nextInfo.namaDufah } : f));
    }
  }, [nextInfo, periods, pBaru.namaDufah]);

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

  // ---- Periode (Fase 4) ----
  function bentukBodyPeriode(f: typeof pBaru) {
    return {
      namaDufah: f.namaDufah,
      tanggalBuka: lokalKeIso(f.tanggalBuka),
      tanggalTutup: lokalKeIso(f.tanggalTutup),
      isTahunBaru: f.isTahunBaru,
      usbu1StartDate: f.usbu1StartDate || null,
      usbu1EndDate: f.usbu1EndDate || null,
      usbu2StartDate: f.usbu2StartDate || null,
      usbu2EndDate: f.usbu2EndDate || null,
      usbu3StartDate: f.usbu3StartDate || null,
      usbu3EndDate: f.usbu3EndDate || null,
    };
  }

  async function tambahPeriode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bentukBodyPeriode(pBaru)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    setPBaru({
      namaDufah: "", tanggalBuka: "", tanggalTutup: "", isTahunBaru: false,
      usbu1StartDate: "", usbu1EndDate: "", usbu2StartDate: "", usbu2EndDate: "",
      usbu3StartDate: "", usbu3EndDate: "",
    });
    muat();
    if (data.ppdb && !data.ppdb.ok) {
      info("Draf periode dibuat, tapi belum tersinkron ke PPDB — coba lagi dari kartu draf.");
    } else {
      info("Draf periode dibuat");
    }
  }

  function bukaEditDraft(p: Period) {
    setEditDraft(p);
    setEditDraftForm({
      namaDufah: p.namaDufah,
      tanggalBuka: isoKeLokal(p.tanggalBuka),
      tanggalTutup: isoKeLokal(p.tanggalTutup),
      isTahunBaru: p.isTahunBaru,
      usbu1StartDate: p.usbu1StartDate || "",
      usbu1EndDate: p.usbu1EndDate || "",
      usbu2StartDate: p.usbu2StartDate || "",
      usbu2EndDate: p.usbu2EndDate || "",
      usbu3StartDate: p.usbu3StartDate || "",
      usbu3EndDate: p.usbu3EndDate || "",
    });
  }

  async function simpanEditDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!editDraft) return;
    const res = await fetch(`/api/admin/periods/${editDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bentukBodyPeriode(editDraftForm)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    setEditDraft(null);
    muat();
    info("Draf periode diperbarui");
  }

  async function hapusDraft(p: Period) {
    if (!confirm(`Hapus draf ${p.namaDufah}? Draf yang sudah dihapus tidak bisa dikembalikan.`)) return;
    const res = await fetch(`/api/admin/periods/${p.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    muat();
    info("Draf dihapus");
  }

  async function bukaKonfirmasi(p: Period) {
    setAktivasiError("");
    setKonfirmasi(p);
    // Baca ulang jumlah terdampak supaya angka di dialog selalu segar.
    const rs = await fetch("/api/admin/periods/stats").then((r) => r.json()).catch(() => ({}));
    setTerdampak(typeof rs.terdampak === "number" ? rs.terdampak : null);
  }

  async function jalankanAktivasi() {
    if (!konfirmasi) return;
    setMengaktifkan(true);
    setAktivasiError("");
    const res = await fetch(`/api/admin/periods/${konfirmasi.id}/activate`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMengaktifkan(false);
    if (!res.ok) {
      setAktivasiError(data.error || "Gagal mengaktifkan periode");
      return;
    }
    setKonfirmasi(null);
    setPropagasi(data.propagasi || null);
    setStatusPropagasi(null);
    muat();
    const pr = data.propagasi;
    if (pr?.verifikasi?.siakadAktif === data.periode.namaDufah) {
      info(`Periode ${data.periode.namaDufah} diaktifkan dan sudah tersinkron ke PPDB + Siakad.`);
    } else if (pr?.rollover?.ok) {
      info(`Periode ${data.periode.namaDufah} diaktifkan di PPDB. Siakad sedang mengikuti — status diperiksa otomatis di bawah.`);
      pollStatus(data.periode.id, 0);
    } else {
      info(`Periode ${data.periode.namaDufah} diaktifkan di Bawwabah, tapi propagasi ke PPDB gagal: ${pr?.rollover?.error || "tidak diketahui"}. Coba lagi dari kartu Status Propagasi.`);
    }
  }

  // Poll status propagasi sampai Siakad mengikuti (maks. 12x tiap 15 dtk).
  async function pollStatus(id: string, n: number) {
    if (n >= 12) return;
    const res = await fetch(`/api/admin/periods/${id}/status`).then((r) => r.json()).catch(() => ({}));
    if (res?.periode) {
      setStatusPropagasi(res);
      if (res.cocok) return;
    }
    setTimeout(() => pollStatus(id, n + 1), 15000);
  }

  async function periksaStatus(id: string) {
    setMemeriksaStatus(true);
    const res = await fetch(`/api/admin/periods/${id}/status`).then((r) => r.json()).catch(() => ({}));
    setMemeriksaStatus(false);
    if (res?.periode) setStatusPropagasi(res);
    else info("Gagal membaca status propagasi");
  }

  async function cobaLagiPropagasi(id: string) {
    const res = await fetch(`/api/admin/periods/${id}/propagasi`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    setPropagasi(data.propagasi || null);
    periksaStatus(id);
    info("Propagasi dicoba lagi — lihat status di bawah.");
  }

  // Coba lagi membuat baris Dufah di PPDB untuk satu draf (rancangan
  // PPDB-pendaftaran). Dipakai bila draf dibuat saat PPDB tidak terjangkau.
  async function cobaLagiSyncPpdb(id: string) {
    setMenyinkronPpdb(true);
    const res = await fetch(`/api/admin/periods/${id}/sync-ppdb`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMenyinkronPpdb(false);
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    muat();
    if (data.ppdb?.ok) info("Draf tersinkron ke PPDB.");
    else info("Masih gagal: " + (data.ppdb?.error || "tidak diketahui"));
  }

  async function kirimUlang(id: string) {
    const res = await fetch(`/api/admin/periods/${id}/kirim-ulang`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    setPropagasi((pr: any) => ({
      ...(pr || {}),
      kirimUlang: data.sync,
      verifikasi: data.verifikasi,
      usbu: data.usbu ?? pr?.usbu,
      emaliyah: data.emaliyah ?? pr?.emaliyah,
    }));
    periksaStatus(id);
    if (data.sync?.ok) info(`Kirim ulang berhasil: ${data.sync.syncedCount ?? "?"} santri disinkronkan.`);
    else info("Kirim ulang gagal: " + (data.sync?.error || "tidak diketahui"));
  }

  function bukaEditUsbu(p: Period) {
    setEditUsbu(p);
    setEditUsbuForm({
      usbu1StartDate: p.usbu1StartDate || "",
      usbu1EndDate: p.usbu1EndDate || "",
      usbu2StartDate: p.usbu2StartDate || "",
      usbu2EndDate: p.usbu2EndDate || "",
      usbu3StartDate: p.usbu3StartDate || "",
      usbu3EndDate: p.usbu3EndDate || "",
    });
  }

  async function simpanEditUsbu(e: React.FormEvent) {
    e.preventDefault();
    if (!editUsbu) return;
    const res = await fetch(`/api/admin/periods/${editUsbu.id}/usbu`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUsbuForm),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return info("Gagal: " + (data.error || "ditolak"));
    setEditUsbu(null);
    muat();
    if (data.usbu?.ok) info("Tanggal Usbu disimpan dan terkirim ke Siakad." + (data.emaliyah?.ok ? " Mapping E-Maliyah dibuat." : ""));
    else if (data.usbu) info("Tanggal Usbu disimpan, tapi gagal terkirim ke Siakad: " + (data.usbu.error || "tidak diketahui"));
    else info("Tanggal Usbu disimpan (periode masih draf — akan dikirim ke Siakad setelah aktivasi).");
  }

  const input =
    "w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-600";
  const kartu = "bg-white/75 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-xl shadow-sky-200/40";

  // ---- Pembantu tanggal periode (semua waktu ditampilkan dalam WIB) ----
  function tampilTanggalWIB(iso: string) {
    return new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }
  function tampilTanggalSaja(tgl: string) {
    return new Date(tgl + "T00:00:00+07:00").toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
    });
  }
  function isoKeLokal(iso: string) {
    // ISO -> "YYYY-MM-DDTHH:mm" dalam WIB (untuk input datetime-local).
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }
  function lokalKeIso(lokal: string) {
    // "YYYY-MM-DDTHH:mm" (yang diketik admin = WIB) -> ISO ber-offset +07:00.
    if (!lokal) return "";
    return lokal.length === 16 ? `${lokal}:00+07:00` : lokal;
  }

  const periodeBerjalan = periods.find((p) => p.isCurrent);
  const drafPeriode = periods.find((p) => !p.activatedAt);

  function tampilMasa(p: Period) {
    if (p.usbu1StartDate && p.usbu3EndDate) {
      return `${tampilTanggalSaja(p.usbu1StartDate)} s.d. ${tampilTanggalSaja(p.usbu3EndDate)}`;
    }
    if (p.usbu1StartDate || p.usbu2StartDate || p.usbu3StartDate) return "belum lengkap";
    return "-";
  }

  function tampilUsbu(p: Period, n: 1 | 2 | 3) {
    const mulai = n === 1 ? p.usbu1StartDate : n === 2 ? p.usbu2StartDate : p.usbu3StartDate;
    const selesai = n === 1 ? p.usbu1EndDate : n === 2 ? p.usbu2EndDate : p.usbu3EndDate;
    if (!mulai || !selesai) return "-";
    return `${tampilTanggalSaja(mulai)} – ${tampilTanggalSaja(selesai)}`;
  }

  // Form draf periode — dipakai form buat dan form edit (field sama).
  function formPeriode(
    f: typeof pBaru,
    setF: (v: typeof pBaru) => void,
    noMarhalah: number | "",
    noNukhbah: number | "",
    namaOtomatis: string
  ) {
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Nama Dufah</span>
            <input className={input} value={f.namaDufah} onChange={(e) => setF({ ...f, namaDufah: e.target.value })} required />
            <span className="text-[11px] text-slate-400">
              Otomatis terisi {namaOtomatis || "-"}; masih bisa diubah.
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Marhalah (otomatis)</span>
            <input className={input} value={noMarhalah} disabled />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Nukhbah (otomatis)</span>
            <input className={input} value={noNukhbah} disabled />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Buka Pendaftaran (WIB)</span>
            <input className={input} type="datetime-local" value={f.tanggalBuka} onChange={(e) => setF({ ...f, tanggalBuka: e.target.value })} required />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Tutup Pendaftaran (WIB)</span>
            <input className={input} type="datetime-local" value={f.tanggalTutup} onChange={(e) => setF({ ...f, tanggalTutup: e.target.value })} required />
          </label>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="w-4 h-4 accent-blue-700 mt-0.5"
            checked={f.isTahunBaru}
            onChange={(e) => setF({ ...f, isTahunBaru: e.target.checked })}
          />
          <span>
            <span className="font-semibold">Tahun Baru (reset Syawal)</span>
            <span className="block text-xs text-slate-500">
              Bila dicentang: bulanKe semua santri direset ke 1 dan semua santri non-KSU wajib pindah sakan saat aktivasi di PPDB.
            </span>
          </span>
        </label>
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Tanggal Usbu (boleh kosong — diisi belakangan saat sudah pasti, biasanya di awal bulan)
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="border border-sky-100 rounded-xl p-3 bg-white/60">
              <p className="text-xs font-bold text-slate-700 mb-2">Usbu 1</p>
              <label className="block mb-2">
                <span className="text-xs text-slate-500">Mulai</span>
                <input className={input} type="date" value={f.usbu1StartDate} onChange={(e) => setF({ ...f, usbu1StartDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Selesai</span>
                <input className={input} type="date" value={f.usbu1EndDate} onChange={(e) => setF({ ...f, usbu1EndDate: e.target.value })} />
              </label>
            </div>
            <div className="border border-sky-100 rounded-xl p-3 bg-white/60">
              <p className="text-xs font-bold text-slate-700 mb-2">Usbu 2</p>
              <label className="block mb-2">
                <span className="text-xs text-slate-500">Mulai</span>
                <input className={input} type="date" value={f.usbu2StartDate} onChange={(e) => setF({ ...f, usbu2StartDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Selesai</span>
                <input className={input} type="date" value={f.usbu2EndDate} onChange={(e) => setF({ ...f, usbu2EndDate: e.target.value })} />
              </label>
            </div>
            <div className="border border-sky-100 rounded-xl p-3 bg-white/60">
              <p className="text-xs font-bold text-slate-700 mb-2">Usbu 3</p>
              <label className="block mb-2">
                <span className="text-xs text-slate-500">Mulai</span>
                <input className={input} type="date" value={f.usbu3StartDate} onChange={(e) => setF({ ...f, usbu3StartDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Selesai</span>
                <input className={input} type="date" value={f.usbu3EndDate} onChange={(e) => setF({ ...f, usbu3EndDate: e.target.value })} />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        <h1 className="pl-14 md:pl-0 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-1">
          Admin Bawwabah
        </h1>
        <div className="pl-14 md:pl-0 flex items-center gap-2 mb-6 flex-wrap">
          <p className="text-sm text-blue-800/60 font-medium">
            Kelola pengguna, website, dan hak akses ekosistem
          </p>
          <span className="text-xs font-semibold bg-blue-700 text-white rounded-full px-3 py-1">
            {JUDUL_TAB[tab]}
          </span>
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
            <div className={`md:col-span-2 ${kartu} overflow-x-auto`}>
              <table className="w-full text-sm min-w-[600px]">
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
            <div className={`md:col-span-2 ${kartu} overflow-x-auto`}>
              <table className="w-full text-sm min-w-[600px]">
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
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 sticky left-0 z-20 bg-sky-50">Pengguna</th>
                  {apps.map((a) => (
                    <th key={a.id} className="px-3 py-2.5 font-semibold text-slate-700 text-center whitespace-nowrap">{a.nama}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-sky-100/60">
                    <td className="px-4 py-2.5 sticky left-0 z-10 bg-white font-medium text-slate-800">
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
            <div className={`md:col-span-2 ${kartu} overflow-x-auto`}>
              <table className="w-full text-sm min-w-[600px]">
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

        {tab === "periode" && (
          <>
            {periodeBerjalan && (
              <div className={`${kartu} p-5 mb-6`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">Periode Berjalan</h3>
                  <span className="text-xs font-semibold bg-blue-700 text-white rounded-full px-3 py-1">Berjalan</span>
                </div>
                <p className="text-lg font-extrabold text-blue-800">
                  {periodeBerjalan.namaDufah}
                  <span className="text-sm font-semibold text-slate-500">
                    {" "}/ Marhalah {periodeBerjalan.noMarhalah} / Nukhbah {periodeBerjalan.noNukhbah}
                  </span>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Pendaftaran: {tampilTanggalWIB(periodeBerjalan.tanggalBuka)} s.d. {tampilTanggalWIB(periodeBerjalan.tanggalTutup)}
                  {periodeBerjalan.isTahunBaru ? " • Tahun Baru (reset Syawal)" : ""}
                </p>
                <p className="text-sm text-slate-600">
                  Usbu 1: {tampilUsbu(periodeBerjalan, 1)} • Usbu 2: {tampilUsbu(periodeBerjalan, 2)} • Usbu 3: {tampilUsbu(periodeBerjalan, 3)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Masa periode: {tampilMasa(periodeBerjalan)}
                  {periodeBerjalan.activatedByUsername ? ` • Diaktifkan oleh ${periodeBerjalan.activatedByUsername}` : ""}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => bukaEditUsbu(periodeBerjalan)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-sky-200 hover:bg-white/70"
                  >
                    Isi/Ubah Tanggal Usbu
                  </button>
                </div>
              </div>
            )}

            {editUsbu && (
              <form onSubmit={simpanEditUsbu} className={`${kartu} p-5 mb-6`}>
                <h3 className="font-bold text-slate-800 mb-1">Tanggal Usbu: {editUsbu.namaDufah}</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Tanggal Usbu boleh diubah pada periode berjalan. Bila sudah lengkap, otomatis terkirim ke Siakad dan E-Maliyah dibuatkan mapping-nya.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {([1, 2, 3] as const).map((n) => (
                    <div key={n} className="border border-sky-100 rounded-xl p-3 bg-white/60">
                      <p className="text-xs font-bold text-slate-700 mb-2">Usbu {n}</p>
                      <label className="block mb-2">
                        <span className="text-xs text-slate-500">Mulai</span>
                        <input className={input} type="date" value={editUsbuForm[`usbu${n}StartDate` as keyof typeof editUsbuForm]} onChange={(e) => setEditUsbuForm({ ...editUsbuForm, [`usbu${n}StartDate`]: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">Selesai</span>
                        <input className={input} type="date" value={editUsbuForm[`usbu${n}EndDate` as keyof typeof editUsbuForm]} onChange={(e) => setEditUsbuForm({ ...editUsbuForm, [`usbu${n}EndDate`]: e.target.value })} />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bg-gradient-to-r from-blue-700 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                    Simpan Tanggal Usbu
                  </button>
                  <button type="button" onClick={() => setEditUsbu(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white/70">
                    Batal
                  </button>
                </div>
              </form>
            )}

            {periodeBerjalan && (propagasi || statusPropagasi) && (
              <div className={`${kartu} p-5 mb-6`}>
                <h3 className="font-bold text-slate-800 mb-3">Status Propagasi — {periodeBerjalan.namaDufah}</h3>
                <dl className="text-sm space-y-2 mb-4">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">PPDB</dt>
                    <dd className="font-medium text-slate-800 text-right">
                      {(statusPropagasi?.ppdbAktif ?? propagasi?.verifikasi?.ppdbAktif) === periodeBerjalan.namaDufah
                        ? `✓ aktif (${periodeBerjalan.namaDufah})`
                        : `belum aktif — terbaca: ${statusPropagasi?.ppdbAktif ?? propagasi?.verifikasi?.ppdbAktif ?? "tidak dapat dibaca"}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Siakad</dt>
                    <dd className="font-medium text-slate-800 text-right">
                      {(statusPropagasi?.siakadAktif ?? propagasi?.verifikasi?.siakadAktif) === periodeBerjalan.namaDufah
                        ? `✓ mengikuti (${statusPropagasi?.siakadJumlah ?? propagasi?.verifikasi?.siakadJumlah ?? "?"} santri aktif)`
                        : `belum mengikuti — terbaca: ${statusPropagasi?.siakadAktif ?? propagasi?.verifikasi?.siakadAktif ?? "tidak dapat dibaca"}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Tanggal Usbu ke Siakad</dt>
                    <dd className="font-medium text-slate-800 text-right">
                      {propagasi?.usbu?.ok
                        ? "✓ terkirim"
                        : propagasi?.usbu
                          ? `gagal: ${propagasi.usbu.error || "tidak diketahui"}`
                          : "menunggu tanggal Usbu lengkap"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">E-Maliyah</dt>
                    <dd className="font-medium text-slate-800 text-right">
                      {propagasi?.emaliyah?.ok
                        ? `✓ mapping bulan ${propagasi.emaliyah.month}/${propagasi.emaliyah.year}${propagasi.emaliyah.sudahAda ? " (sudah ada)" : " dibuat"}`
                        : propagasi?.emaliyah
                          ? `gagal: ${propagasi.emaliyah.error || "tidak diketahui"}`
                          : "menunggu tanggal Usbu lengkap"}
                    </dd>
                  </div>
                  {propagasi?.rollover?.ok && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Rollover PPDB</dt>
                      <dd className="font-medium text-slate-800 text-right">
                        CO {propagasi.rollover.coCount ?? "?"} santri • {propagasi.rollover.riwayatBaru ?? "?"} riwayat baru • {propagasi.rollover.mutasiCount ?? "?"} mutasi sakan
                        {propagasi.rollover.sudahDilakukan ? " (hasil lama)" : ""}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => periksaStatus(periodeBerjalan.id)}
                    disabled={memeriksaStatus}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-sky-200 hover:bg-white/70 disabled:opacity-50"
                  >
                    {memeriksaStatus ? "Memeriksa..." : "Periksa Status"}
                  </button>
                  {(statusPropagasi?.siakadAktif ?? propagasi?.verifikasi?.siakadAktif) !== periodeBerjalan.namaDufah && (
                    <button
                      onClick={() => kirimUlang(periodeBerjalan.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25"
                    >
                      Kirim Ulang ke Siakad
                    </button>
                  )}
                  {propagasi?.rollover && !propagasi.rollover.ok && (
                    <button
                      onClick={() => cobaLagiPropagasi(periodeBerjalan.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25"
                    >
                      Coba Lagi Propagasi
                    </button>
                  )}
                </div>
              </div>
            )}

            {drafPeriode && !editDraft && (
              <div className={`${kartu} p-5 mb-6`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">Draf Periode Berikutnya</h3>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-3 py-1">Draf</span>
                </div>
                <p className="text-lg font-extrabold text-slate-800">
                  {drafPeriode.namaDufah}
                  <span className="text-sm font-semibold text-slate-500">
                    {" "}/ Marhalah {drafPeriode.noMarhalah} / Nukhbah {drafPeriode.noNukhbah}
                  </span>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Pendaftaran: {tampilTanggalWIB(drafPeriode.tanggalBuka)} s.d. {tampilTanggalWIB(drafPeriode.tanggalTutup)}
                  {drafPeriode.isTahunBaru ? " • Tahun Baru (reset Syawal)" : ""}
                </p>
                <p className="text-sm text-slate-600">
                  Usbu 1: {tampilUsbu(drafPeriode, 1)} • Usbu 2: {tampilUsbu(drafPeriode, 2)} • Usbu 3: {tampilUsbu(drafPeriode, 3)}
                </p>
                <p className="text-sm text-slate-600">
                  PPDB: {drafPeriode.ppdbDufahId !== null
                    ? `✓ tersinkron (baris PPDB id ${drafPeriode.ppdbDufahId})`
                    : "⚠ belum tersinkron ke PPDB — pendaftaran tidak bisa dibuka sampai tersinkron"}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => bukaKonfirmasi(drafPeriode)}
                    className="bg-gradient-to-r from-blue-700 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25"
                  >
                    Aktifkan Periode
                  </button>
                  {drafPeriode.ppdbDufahId === null && (
                    <button
                      onClick={() => cobaLagiSyncPpdb(drafPeriode.id)}
                      disabled={menyinkronPpdb}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg shadow-amber-600/25 disabled:opacity-50"
                    >
                      {menyinkronPpdb ? "Menyinkronkan..." : "Sinkronkan ke PPDB"}
                    </button>
                  )}
                  <button
                    onClick={() => bukaEditDraft(drafPeriode)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-sky-200 hover:bg-white/70"
                  >
                    Edit Draf
                  </button>
                  <button
                    onClick={() => hapusDraft(drafPeriode)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Hapus Draf
                  </button>
                </div>
              </div>
            )}

            {drafPeriode && editDraft && (
              <form onSubmit={simpanEditDraft} className={`${kartu} p-5 mb-6`}>
                <h3 className="font-bold text-slate-800 mb-3">Edit Draf: {editDraft.namaDufah}</h3>
                {formPeriode(editDraftForm, setEditDraftForm, editDraft.noMarhalah, editDraft.noNukhbah, nextInfo?.namaDufah || "")}
                <div className="flex gap-2 mt-4">
                  <button className="bg-gradient-to-r from-blue-700 to-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                    Simpan
                  </button>
                  <button type="button" onClick={() => setEditDraft(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white/70">
                    Batal
                  </button>
                </div>
              </form>
            )}

            {!drafPeriode && (
              <form onSubmit={tambahPeriode} className={`${kartu} p-5 mb-6`}>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Plus size={16} /> Buat Draf Periode Baru
                </h3>
                {formPeriode(pBaru, setPBaru, nextInfo?.noMarhalah ?? "", nextInfo?.noNukhbah ?? "", nextInfo?.namaDufah || "")}
                <button className="w-full mt-4 bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                  Simpan Draf
                </button>
              </form>
            )}
            {drafPeriode && !editDraft && (
              <p className="text-xs text-slate-500 mb-6">
                Sudah ada satu draf periode. Selesaikan dulu draf tersebut (aktifkan atau hapus) sebelum membuat yang baru.
              </p>
            )}

            <div className={`${kartu} overflow-x-auto`}>
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-sky-50/70 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Periode</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Pendaftaran (WIB)</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Masa Periode</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Diaktifkan oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.id} className="border-t border-sky-100/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {p.namaDufah}
                        <span className="text-slate-500 text-xs"> / M{p.noMarhalah} / N{p.noNukhbah}</span>
                        {p.isTahunBaru && (
                          <span className="ml-1 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Tahun Baru</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {tampilTanggalWIB(p.tanggalBuka)} s.d. {tampilTanggalWIB(p.tanggalTutup)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{tampilMasa(p)}</td>
                      <td className="px-4 py-2.5">
                        {p.isCurrent ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-700 text-white">Berjalan</span>
                        ) : !p.activatedAt ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Draf</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Riwayat</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{p.activatedByUsername || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {periods.length === 0 && (
                <p className="text-sm text-slate-500 px-4 py-6 text-center">Belum ada periode tercatat.</p>
              )}
              <p className="text-xs text-slate-500 px-4 py-3 border-t border-sky-100/60">
                Riwayat hanya untuk dilihat — periode lama tidak bisa diaktifkan kembali.
              </p>
            </div>

            {konfirmasi && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Aktifkan {konfirmasi.namaDufah}?</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Marhalah {konfirmasi.noMarhalah} / Nukhbah {konfirmasi.noNukhbah}
                  </p>
                  <dl className="text-sm space-y-2 mb-4">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Nama Dufah</dt>
                      <dd className="font-medium text-slate-800">{konfirmasi.namaDufah}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Pendaftaran</dt>
                      <dd className="font-medium text-slate-800 text-right">
                        {tampilTanggalWIB(konfirmasi.tanggalBuka)} s.d. {tampilTanggalWIB(konfirmasi.tanggalTutup)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Tahun Baru</dt>
                      <dd className="font-medium text-slate-800 text-right">
                        {konfirmasi.isTahunBaru
                          ? "Ya — bulanKe direset ke 1, semua santri non-KSU wajib pindah sakan saat aktivasi di PPDB"
                          : "Tidak"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Usbu 1</dt>
                      <dd className="font-medium text-slate-800">{tampilUsbu(konfirmasi, 1)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Usbu 2</dt>
                      <dd className="font-medium text-slate-800">{tampilUsbu(konfirmasi, 2)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Usbu 3</dt>
                      <dd className="font-medium text-slate-800">{tampilUsbu(konfirmasi, 3)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Santri terdampak</dt>
                      <dd className="font-medium text-slate-800">
                        {terdampak === null ? "tidak dapat dibaca" : `${terdampak} santri aktif PPDB`}
                      </dd>
                    </div>
                  </dl>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-800 mb-3">
                    Aktivasi tidak bisa dibatalkan. Periode lama tetap tercatat di riwayat, tapi tidak bisa diaktifkan kembali.
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5 text-sm text-blue-800 mb-4">
                    Menekan Aktifkan akan menggerakkan PPDB (rollover: auto-CO + migrasi + mutasi sakan), lalu Siakad mengikuti lewat webhook, dan E-Maliyah dibuatkan mapping-nya. Tanggal Usbu boleh kosong — bisa diisi belakangan, dan akan terkirim otomatis ke Siakad saat ditetapkan.
                  </div>
                  {aktivasiError && (
                    <p className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">{aktivasiError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={jalankanAktivasi}
                      disabled={mengaktifkan}
                      className="flex-1 bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25 disabled:opacity-50"
                    >
                      {mengaktifkan ? "Mengaktifkan..." : `Ya, Aktifkan Periode ${konfirmasi.noDufah}`}
                    </button>
                    <button
                      onClick={() => setKonfirmasi(null)}
                      disabled={mengaktifkan}
                      className="flex-1 border border-sky-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/70 disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
