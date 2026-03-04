import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Givezy is a Hyderabad-based initiative that makes donating books and clothes effortless with free doorstep pickup.",
});

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About Givezy</h1>

      <div className="prose prose-gray max-w-none space-y-4 text-gray-600 leading-relaxed">
        <p>
          Givezy started with a simple observation: most people in Hyderabad have books
          they&apos;ve finished reading and clothes they no longer wear, but donating them
          feels like a chore. You have to find an NGO, pack things up, and figure out
          drop-off logistics.
        </p>
        <p>
          We remove that friction entirely. You tell us what you have, we come to your
          doorstep and pick it up — for free. Your pre-loved items go to people and
          communities who need them.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What we accept</h2>
        <p>
          Right now we focus on two categories: <strong>books</strong> (textbooks, novels,
          children&apos;s books, magazines) and <strong>clothes</strong> (clean, wearable
          clothing for men, women, and children). We plan to expand categories seasonally.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Where we operate</h2>
        <p>
          We serve all of Hyderabad — from Secunderabad to Shamshabad, HITEC City to Old
          City. If you have a Hyderabad pincode, we&apos;ll come to you.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">How it works</h2>
        <p>
          Fill out our donation form with a few details about your items and your contact
          info. Our team will reach out within 48 hours to confirm a pickup slot that works
          for you. On the scheduled day, we show up at your door and collect your donation.
        </p>
      </div>
    </div>
  );
}
