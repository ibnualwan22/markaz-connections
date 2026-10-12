import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bawwabah — Gerbang Ekosistem Digital Markaz Arabiyah",
  description:
    "Pintu gerbang utama seluruh website Markaz Arabiyah: direktori layanan, login satu akun, dan pengaturan akses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
