import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readJson, User } from "@/lib/store";
import SidebarNav from "@/components/SidebarNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bawwabah — Gerbang Ekosistem Digital Markaz Arabiyah",
  description:
    "Pintu gerbang utama seluruh website Markaz Arabiyah: direktori layanan, login satu akun, dan pengaturan akses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sidebar hanya untuk halaman yang sudah login; halaman publik (landing,
  // login) tetap tampil tanpa sidebar.
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  const users = payload ? await readJson<User[]>("users.json", []) : [];
  const user = payload
    ? users.find((u) => u.id === payload.sub && u.aktif)
    : undefined;

  return (
    <html lang="id">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {user ? (
          <>
            <SidebarNav
              user={{
                nama: user.nama,
                username: user.username,
                foto: user.foto,
                peran: user.peran,
              }}
            />
            <div className="md:pl-64">{children}</div>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
