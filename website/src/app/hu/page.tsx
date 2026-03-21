import { HungaryPage } from "./HungaryPage";

export const metadata = {
  title: "Hungary Election 2026 | Magyar választások 2026 — Prism",
  description:
    "Understand the 2026 Hungarian parliamentary election. Party positions on key issues, constituency lookup. No voting recommendations.",
  openGraph: {
    title: "Hungary Election 2026 | Prism",
    description:
      "Party comparison and constituency guide for the April 12 2026 Hungarian election.",
  },
};

export default function Page() {
  return <HungaryPage />;
}
