import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminSignOut from "@/components/AdminSignOut";

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
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/admin/export"
              className="text-gray-300 hover:text-white text-sm"
            >
              Export CSV
            </a>
            <AdminSignOut />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
