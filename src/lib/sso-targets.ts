// Web yang SSO-nya sudah jadi. Data murni (tanpa nilai crypto) supaya bisa
// dipakai komponen client (dashboard) maupun route server (penerbit token).
// secretEnv = NAMA variabel env secret pasangan itu (bukan nilainya);
// tiap arah punya secret sendiri supaya token satu arah tak bisa dipakai
// untuk arah lain. username = verifier tujuan memetakan akun lewat
// username Bawwabah (bukan siakadId).
export interface SsoTarget {
  url: string;
  aud: string;
  secretEnv: string;
  username?: boolean;
}

export const SSO_TARGETS: Record<string, SsoTarget> = {
  "siakad-ma": {
    url: "https://siakad.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "siakad",
    secretEnv: "BAWWABAH_SSO_SECRET",
  },
  "siakad-mt": {
    url: "https://siakad.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "siakad",
    secretEnv: "BAWWABAH_SSO_SECRET",
  },
  "ppdb-ma": {
    url: "https://ppdb.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "ppdb",
    secretEnv: "BAWWABAH_PPDB_SSO_SECRET",
    username: true,
  },
  "ppdb-mt": {
    url: "https://ppdb.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "ppdb",
    secretEnv: "BAWWABAH_PPDB_SSO_SECRET",
    username: true,
  },
  "e-maliyah": {
    url: "https://e-maliyah.markazarabiyah.site/api/v1/sso/bawwabah",
    aud: "emaliyah",
    secretEnv: "BAWWABAH_EMALIYAH_SSO_SECRET",
  },
  "e-markaz": {
    url: "https://e-markaz.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "emarkaz",
    secretEnv: "BAWWABAH_EMARKAZ_SSO_SECRET",
    username: true,
  },
};
