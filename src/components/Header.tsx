import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">Givezy</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            About
          </Link>
          <Link
            href="/donate"
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Donate Now
          </Link>
        </div>
      </nav>
    </header>
  );
}
