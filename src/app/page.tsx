import { buildMetadata } from "@/lib/seo";
import HomeContent from "@/components/HomeContent";
import { getContent, getBags } from "@/lib/settings";

export const metadata = buildMetadata();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, bags] = await Promise.all([getContent(), getBags()]);
  // The homepage prices itself from Settings rather than from the markup, so
  // changing the price stays one field in the admin panel.
  const bag = bags[0] ?? null;
  return <HomeContent content={content} bag={bag} />;
}
