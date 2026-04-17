import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Cooperative Manager</h1>
            </div>
            <div className="flex items-center">
              <p className="mr-4">Welcome, {session.user.name}</p>
              <form action="/api/auth/signout" method="POST">
                <button className="bg-red-600 text-white px-4 py-2 rounded">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Role</h3>
            <p className="text-gray-600">{session.user.role}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Cooperative ID</h3>
            <p className="text-gray-600">{session.user.cooperativeId}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-gray-600">{session.user.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
