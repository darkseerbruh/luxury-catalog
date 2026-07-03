import type { Metadata } from "next";
import { SocialGrid } from "./SocialGrid";
import { SITE_URL } from "@/lib/geo";

const TITLE = "From our videos · Luxury Catalog";
const DESCRIPTION =
  "The grid from our videos, tappable: every video's article in posting order. Or type the key you heard into search and it takes you straight there.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/social` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/social`, type: "website" },
};

export default function Page() {
  return <SocialGrid platform={undefined} />;
}
