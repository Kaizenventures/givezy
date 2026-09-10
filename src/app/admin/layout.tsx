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
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm">Givezy Admin</span>
            <Link href="/admin" className="text-gray-300 hover:text-white text-sm">
              Dashboard
            </Link>
            <Link href="/admin/donations" className="text-gray-300 hover:text-white text-sm">
              Donations
            </Link>
            <Link href="/admin/waitlist" className="text-gray-300 hover:text-white text-sm">
              Waitlist
            </Link>
            <Link href="/admin/leads" className="text-gray-300 hover:text-white text-sm">
              Leads
            </Link>
            <Link href="/admin/settings" className="text-gray-300 hover:text-white text-sm">
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/admin/export" className="text-gray-300 hover:text-white text-sm">
              Export
            </a>
            <AdminSignOut />
          </div>
        </div>
      </div>
      {isDemoMode() && (
        <div className="bg-amber-100 border-b-2 border-amber-400">
          <div className="max-w-5xl mx-auto px-4 py-2.5 text-sm text-amber-900">
            <strong>Demo mode is on.</strong> Donations are recorded as paid without any real payment.
            Set <code className="bg-amber-200 px-1 rounded">DEMO_MODE=false</code> (or add live Razorpay
            keys) before taking real donations.
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
