// Web yang SSO-nya sudah jadi. Data murni (tanpa crypto) supaya bisa
// dipakai komponen client (dashboard) maupun route server (penerbit token).
export interface SsoTarget {
  url: string;
  aud: string;
}

export const SSO_TARGETS: Record<string, SsoTarget> = {
  "siakad-ma": {
    url: "https://siakad.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "siakad",
  },
  "siakad-mt": {
    url: "https://siakad.markazarabiyah.site/api/auth/sso/bawwabah",
    aud: "siakad",
  },
};
