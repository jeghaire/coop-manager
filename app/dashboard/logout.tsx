"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/signin");
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
    >
      Logout
    </button>
  );
}
