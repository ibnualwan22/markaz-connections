"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Eye, EyeOff } from "lucide-react";

function FormLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSibuk(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
            <LayoutGrid size={22} />
          </div>
          <div className="font-bold text-xl">Bawwabah</div>
        </Link>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-center">Masuk ke Gerbang</h1>
          <p className="text-sm text-stone-500 text-center mt-1 mb-5">
            Gunakan akun Markaz Connection Anda
          </p>

          <form onSubmit={masuk} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                className="mt-1 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  type={lihat ? "text" : "password"}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setLihat(!lihat)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sibuk}
              className="w-full bg-emerald-700 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {sibuk ? "Memeriksa..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-500 mt-4">
          <Link href="/" className="hover:text-emerald-700">
            &larr; Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-stone-500">Memuat...</div>}>
      <FormLogin />
    </Suspense>
  );
}
