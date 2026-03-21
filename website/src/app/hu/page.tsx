import { HungaryPage } from "./HungaryPage";

export const metadata = {
  title: "Magyar választások 2026 | Április 12. — Prism",
  description:
    "Értsd meg a választást. Pártok álláspontjai, jelöltek választókerületenként. Nem mondunk szavazási ajánlást.",
  openGraph: {
    title: "Választások 2026 | Április 12.",
    description: "Láss, mielőtt döntesz. Pártok, jelöltek, körzetek — átláthatóan.",
    images: [
      {
        url: "/og-image-hu.png",
        width: 1200,
        height: 630,
        alt: "Magyar választások 2026 — Prism",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Választások 2026 | Április 12.",
    description: "Láss, mielőtt döntesz.",
    images: ["/og-image-hu.png"],
  },
};

export default function Page() {
  return <HungaryPage />;
}
