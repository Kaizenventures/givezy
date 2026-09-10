import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "../layout";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import { getSiteConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { buckets, caps, content } = await getSiteConfig();

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Pricing, daily limits and the copy on the public site.</p>
      <AdminSettingsForm initialBuckets={buckets} initialCaps={caps} initialContent={content} />
    </AdminShell>
  );
}
