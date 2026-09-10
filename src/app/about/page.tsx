import { buildMetadata } from "@/lib/seo";
import AboutContent from "@/components/AboutContent";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Givezy is a Hyderabad-based initiative that makes donating books and clothes effortless with doorstep pickup.",
});

export default function AboutPage() {
  return <AboutContent />;
}
