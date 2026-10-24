"use client";

import { useEffect, useState } from "react";
import HexBackground from "@/lib/HexBackground";

const FIELD_LABEL: Record<string, string> = {
  nama: "Nama lengkap",
  email: "Email",
  no_wa: "No WA aktif",
  alamat: "Alamat lengkap",
  tempat_lahir: "Tempat lahir",
  tanggal_lahir: "Tanggal lahir",
  pendidikan_terakhir: "Pendidikan terakhir",
  jabatan: "Jabatan",
};

export default function Profil() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState("");
  const [pesan, setPesan] = useState("");
  const [otpTerkirim, setOtpTerkirim] = useState(false);
  const [otp, setOtp] = useState("");
  const [pwOtp, setPwOtp] = useState("");
  const [pwLama, setPwLama] = useState("");
  const [pwBaru, setPwBaru] = useState("");

  async function muat() {
    const r = await fetch("/api/profil").then((x) => x.json());
    if (r.user) {
      const f: Record<string, string> = {};
      for (const k of Object.keys(FIELD_LABEL)) f[k] = r.user[k] || "";
      setForm(f);
      setFoto(r.user.foto || "");
    }
  }

  useEffect(() => {
    muat();
  }, []);

  function info(t: string) {
    setPesan(t);
    setTimeout(() => setPesan(""), 4000);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    info("Profil disimpan");
  }

  async function unggahFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("foto", f);
    const res = await fetch("/api/profil/foto", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setFoto(data.foto);
    info("Foto profil disimpan");
  }

  async function mintaOtp() {
    const res = await fetch("/api/auth/otp/request", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setOtpTerkirim(true);
    info("Kode OTP dikirim ke WA Anda");
  }

  async function ubahPwOtp(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/otp/ubah-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, passwordBaru: pwOtp }),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setOtp("");
    setPwOtp("");
    setOtpTerkirim(false);
    info("Password berhasil diubah");
  }

  async function ubahPwLama(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/ubah-password-lama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordLama: pwLama, passwordBaru: pwBaru }),
    });
    const data = await res.json();
    if (!res.ok) return info("Gagal: " + data.error);
    setPwLama("");
    setPwBaru("");
    info("Password berhasil diubah");
  }

  const input =
    "w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-600";
  const kartu = "bg-white/75 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-xl shadow-sky-200/40";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <HexBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-14 pb-20 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-sky-400 bg-clip-text text-transparent mb-1">
          Profil Saya
        </h1>
        <p className="text-sm text-blue-800/60 font-medium mb-6">
          Data diri, foto profil, dan ganti password
        </p>
        {pesan && (
          <p className="mb-4 text-sm bg-sky-50 border border-sky-200 text-blue-700 rounded-xl px-3 py-2">{pesan}</p>
        )}

        <form onSubmit={simpan} className={`${kartu} p-5 mb-6`}>
          <h3 className="font-bold text-slate-800 mb-3">Data diri</h3>
          <div className="flex items-center gap-4 mb-4">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="Foto profil" className="w-20 h-20 rounded-full object-cover border-2 border-sky-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
                Belum ada foto
              </div>
            )}
            <label className="text-sm text-blue-700 underline cursor-pointer">
              Unggah foto (JPG/PNG/WebP, maks 2 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={unggahFoto} />
            </label>
          </div>
          <div className="space-y-3">
            {Object.entries(FIELD_LABEL).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs font-semibold text-slate-600">{label}</span>
                <input
                  className={input}
                  type={k === "tanggal_lahir" ? "date" : "text"}
                  value={form[k] || ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
            <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
              Simpan profil
            </button>
          </div>
        </form>

        <form onSubmit={ubahPwOtp} className={`${kartu} p-5 mb-6`}>
          <h3 className="font-bold text-slate-800 mb-3">Ganti password (OTP WA)</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={mintaOtp}
              className="w-full border border-blue-600 text-blue-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50"
            >
              Kirim kode OTP ke WA saya
            </button>
            {otpTerkirim && (
              <>
                <input className={input} placeholder="Kode OTP 6 digit" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                <input className={input} type="password" placeholder="Password baru (min 6 karakter)" value={pwOtp} onChange={(e) => setPwOtp(e.target.value)} required />
                <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
                  Ubah password
                </button>
              </>
            )}
          </div>
        </form>

        <form onSubmit={ubahPwLama} className={`${kartu} p-5`}>
          <h3 className="font-bold text-slate-800 mb-3">Ganti password (verifikasi password lama)</h3>
          <p className="text-xs text-slate-500 mb-3">Jalur darurat bila OTP WA belum bisa dipakai.</p>
          <div className="space-y-3">
            <input className={input} type="password" placeholder="Password lama" value={pwLama} onChange={(e) => setPwLama(e.target.value)} required />
            <input className={input} type="password" placeholder="Password baru (min 6 karakter)" value={pwBaru} onChange={(e) => setPwBaru(e.target.value)} required />
            <button className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-800 hover:to-sky-600 shadow-lg shadow-blue-600/25">
              Ubah password
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
