import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import EditorialCoverPreview, {
  type EditorialCoverEntry,
} from "@/components/life/EditorialCoverPreview";
import { getPostsByCategory } from "@/lib/life";

export const metadata: Metadata = {
  title: "Baking Editorial Cover Study - Lu Ying",
  description: "Three layout studies for the Baking editorial cover archive.",
  robots: { index: false, follow: false },
};

export default function BakingEditorialPreviewPage() {
  const entries: EditorialCoverEntry[] = getPostsByCategory("baking")
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      titleEn: post.titleEn,
      date: post.date,
      kind: post.kind,
      note: post.note,
      hasRecipe: post.recipes.length > 0,
      image: `/life/baking/editorial/${post.slug}-editorial.webp`,
    }))
    .filter((entry) =>
      fs.existsSync(path.join(process.cwd(), "public", entry.image.replace(/^\//, "")))
    );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <EditorialCoverPreview entries={entries} />
    </div>
  );
}
