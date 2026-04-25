"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/app/lib/auth-client";

export default function TestPage() {
  const { data: session } = useSession();
  const [adminData, setAdminData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session || !session.user) return;

    const { cooperativeId, role } = session.user;

    async function fetchDashboards() {
      try {
        // Test member dashboard
        const memberRes = await fetch(
          `/api/member/dashboard?cooperativeId=${cooperativeId}`,
        );
        if (memberRes.ok) {
          setMemberData(await memberRes.json());
        }

        // Test admin dashboard (will fail if not admin)
        if (role === "ADMIN" || role === "OWNER") {
          const adminRes = await fetch(
            `/api/admin/dashboard?cooperativeId=${cooperativeId}`,
          );
          if (adminRes.ok) {
            setAdminData(await adminRes.json());
          } else {
            const err = await adminRes.json();
            setError(err.error);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchDashboards();
  }, [session]);

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Middleware</h1>

      <div className="border p-4 rounded mb-4">
        <h2 className="font-bold">Your Session</h2>
        <p>ID: {session.user.id}</p>
        <p>Email: {session.user.email}</p>
        <p>Coop ID: {session.user.cooperativeId}</p>
        <p>Role: {session.user.role}</p>
      </div>

      {memberData && (
        <div className="border p-4 rounded mb-4">
          <h2 className="font-bold">Member Dashboard ✓</h2>
          <pre className="text-sm">{JSON.stringify(memberData, null, 2)}</pre>
        </div>
      )}

      {adminData && (
        <div className="border p-4 rounded mb-4">
          <h2 className="font-bold">Admin Dashboard ✓</h2>
          <pre className="text-sm">{JSON.stringify(adminData, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="border p-4 rounded">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
