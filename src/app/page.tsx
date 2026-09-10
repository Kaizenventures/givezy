import { buildMetadata } from "@/lib/seo";
import HomeContent from "@/components/HomeContent";
import { getContent } from "@/lib/settings";

export const metadata = buildMetadata();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getContent();
  return <HomeContent content={content} />;
}
