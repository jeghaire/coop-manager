"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/lib/auth-client";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cooperativeName, setCooperativeName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First create the cooperative
      const coopRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cooperativeName }),
      });

      if (!coopRes.ok) {
        const data = await coopRes.json();
        setError(data.error || "Failed to create cooperative");
        setLoading(false);
        return;
      }

      const { cooperativeId } = await coopRes.json();

      // Then use better-auth to create the user
      const signUpResult = await signUp.email({
        email,
        password,
        name,
        cooperativeId,
        role: "OWNER",
      });

      if (signUpResult.error) {
        setError(signUpResult.error.message || "Sign up failed");
        setLoading(false);
        return;
      }

      // Redirect to signin to login
      router.push("/auth/signin");
    } catch (err) {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Your Cooperative</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Cooperative Name
            </label>
            <input
              type="text"
              value={cooperativeName}
              onChange={(e) => setCooperativeName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
