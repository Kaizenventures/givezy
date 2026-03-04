import { buildMetadata } from "@/lib/seo";
import HomeContent from "@/components/HomeContent";

export const metadata = buildMetadata();

export default function HomePage() {
  return <HomeContent />;
}
