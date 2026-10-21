import Link from "next/link";
import Image from "next/image";
import { Heart, Instagram } from "lucide-react";

// The profile, confirmed by the team.
const INSTAGRAM_URL = "https://www.instagram.com/givezy.in/";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 relative">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Image
              src="/logo-wordmark.png"
              alt="Givezy"
              width={449}
              height={160}
              className="h-9 w-auto mb-4"
            />
            <p className="text-gray-500 text-sm leading-relaxed">
              Clear your space. Give your things a second chance. Doorstep decluttering
              across Hyderabad.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors"
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
              Follow us on Instagram
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/donate" className="text-gray-500 hover:text-brand transition-colors">
                  Book a pickup
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-gray-500 hover:text-brand transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray-500 hover:text-brand transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-gray-500 hover:text-brand transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-500 hover:text-brand transition-colors">
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
              <a href="mailto:kaizen.labsindia@gmail.com" className="text-brand hover:underline">
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
