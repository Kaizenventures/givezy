import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 relative">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-bold text-emerald-600 text-xl mb-3">Givezy</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Donate books and clothes in Hyderabad with doorstep pickup.
              Give your pre-loved items a second life.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
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
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-4">Contact</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Currently operating across Hyderabad, Telangana.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              <a href="mailto:kaizen.labsindia@gmail.com" className="text-emerald-600 hover:underline">
                kaizen.labsindia@gmail.com
              </a>
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} Givezy. All rights reserved.</span>
          <span className="inline-flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-400" /> in Hyderabad
          </span>
        </div>
      </div>
    </footer>
  );
}
