import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-emerald-600 text-lg mb-2">Givezy</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Donate books and clothes in Hyderabad with free doorstep pickup.
              Give your pre-loved items a second life.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/donate" className="text-gray-500 hover:text-emerald-600 transition-colors">
                  Donate Items
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-500 hover:text-emerald-600 transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Service Area</h4>
            <p className="text-gray-500 text-sm">
              Currently operating in Hyderabad, Telangana, India.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Contact: <a href="mailto:hello@givezy.in" className="text-emerald-600 hover:underline">hello@givezy.in</a>
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} Givezy. Made with care in Hyderabad.
        </div>
      </div>
    </footer>
  );
}
