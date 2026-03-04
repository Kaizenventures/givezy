import Link from "next/link";

const CATEGORIES = [
  {
    name: "Books",
    slug: "books",
    icon: "📚",
    description: "Textbooks, novels, children's books, magazines — any readable material in decent shape.",
  },
  {
    name: "Clothes",
    slug: "clothes",
    icon: "👕",
    description: "Clean, wearable clothing for men, women, or children. All sizes welcome.",
  },
];

const STEPS = [
  { number: "1", title: "Tell us what you have", description: "Fill a quick form with item details and a photo." },
  { number: "2", title: "We get in touch", description: "Our team contacts you to schedule a convenient pickup time." },
  { number: "3", title: "Free doorstep pickup", description: "We come to your door and collect the items. That's it!" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Donate Books &amp; Clothes in Hyderabad
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Free doorstep pickup. Your pre-loved items find a new home — without you leaving yours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/donate"
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors"
            >
              Donate Now
            </Link>
            <Link
              href="/about"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            What can you donate?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/donate?category=${cat.slug}`}
                className="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <span className="text-4xl">{cat.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {step.number}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Serving all of Hyderabad
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            We currently pick up donations across Hyderabad — from Secunderabad to
            Shamshabad, Gachibowli to Uppal. If you&apos;re within city limits,
            we&apos;ll come to you.
          </p>
          <Link
            href="/donate"
            className="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Start Donating
          </Link>
        </div>
      </section>
    </>
  );
}
