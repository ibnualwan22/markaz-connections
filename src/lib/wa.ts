// Pengirim WA lewat gateway WA VM private (whatsapp-web.js, nomor Bot Aksara
// 6285920508281). VPS mencapai gateway lewat Tailscale (IP tailnet VM private).
// BENTUK ENDPOINT MASIH PERLU DIKONFIRMASI ke server.js gateway saat VM
// private hidup kembali — URL lengkap + bentuk payload diatur lewat env:
//   WA_GATEWAY_URL    (default http://100.94.148.88:3100/send)
//   WA_GATEWAY_SECRET (opsional, dikirim sebagai header x-api-key)
// Kode OTP TIDAK PERNAH ditulis ke log.
export async function kirimWa(
  noWa: string,
  pesan: string
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.WA_GATEWAY_URL || "http://100.94.148.88:3100/send";
  const secret = process.env.WA_GATEWAY_SECRET || "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-api-key": secret } : {}),
      },
      body: JSON.stringify({ to: noWa, message: pesan }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { ok: false, error: `Gateway WA menjawab ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Gateway WA tidak terjangkau" };
  }
}

export async function kirimOtpWa(
  noWa: string,
  kode: string
): Promise<{ ok: boolean; error?: string }> {
  return kirimWa(
    noWa,
    `Kode OTP Bawwabah Anda: ${kode}. Berlaku 10 menit, jangan bagikan ke siapa pun.`
  );
}
