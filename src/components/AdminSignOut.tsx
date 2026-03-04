"use client";

import { signOut } from "next-auth/react";

export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-gray-400 hover:text-white text-sm"
    >
      Sign Out
    </button>
  );
}
