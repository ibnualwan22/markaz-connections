// Strip logo ekosistem berjalan ke kiri, looping tanpa henti.
// Dipakai halaman login dan beranda — ubah di sini, berubah di keduanya.
const LOGOS = [
  "/images/logo-ppdb-ma.png",
  "/images/logo-ppdb-mt.png",
  "/images/logo-siakad-ma.png",
  "/images/logo-siakad-mt.png",
  "/images/logo-emaliyah.png",
  "/images/logo-etalim.png",
  "/images/logo-mediator.png",
];

export default function LogoMarquee() {
  const ganda = [...LOGOS, ...LOGOS];
  return (
    <div>
      <p className="text-center text-xs font-semibold text-blue-400/70 mb-3 tracking-wide">
        EKOSISTEM DIGITAL MARKAZ ARABIYAH
      </p>
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max items-center gap-10 animate-marquee">
          {ganda.map((src, i) => (
            <div
              key={i}
              className="w-16 h-16 shrink-0 rounded-2xl bg-white/80 border border-sky-100 shadow-sm flex items-center justify-center p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
