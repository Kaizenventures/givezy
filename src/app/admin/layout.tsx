import Link from "next/link";
import AdminSignOut from "@/components/AdminSignOut";
import { isDemoMode } from "@/lib/demo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow the login page through without auth
  // Auth check happens for all other admin pages
  return <>{children}</>;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh]">
      <div className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 overflow-x-auto">
            <span className="font-semibold text-sm whitespace-nowrap">Givezy Admin</span>
            {[
              { href: "/admin", label: "Today" },
              { href: "/admin/donations", label: "Donations" },
              { href: "/admin/recovery", label: "Follow-ups" },
              { href: "/admin/waitlist", label: "Waitlist" },
              { href: "/admin/payments", label: "Payments" },
              { href: "/admin/localities", label: "Areas" },
              { href: "/admin/leads", label: "Leads" },
              { href: "/admin/settings", label: "Settings" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-gray-300 hover:text-white text-sm whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a href="/api/admin/export" className="text-gray-300 hover:text-white text-sm whitespace-nowrap">
              Export
            </a>
            <AdminSignOut />
          </div>
        </div>
      </div>
      {isDemoMode() && (
        <div className="bg-amber-100 border-b-2 border-amber-400">
          <div className="max-w-6xl mx-auto px-4 py-2.5 text-sm text-amber-900">
            <strong>Demo mode is on.</strong> Donations are recorded as paid without any real payment.
            Set <code className="bg-amber-200 px-1 rounded">DEMO_MODE=false</code> (or add live Razorpay
            keys) before taking real donations.
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
