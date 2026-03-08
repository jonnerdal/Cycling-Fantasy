"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;

    const identifier = (form.elements.namedItem("identifier") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
      });

      if (!res) {
        setError("Something went wrong. Please try again.");
        return;
      }

      if (res.error) {
        // Only show credential errors
        if (res.error === "CredentialsSignin") {
          setError("Invalid username/email or password");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      // Successful login
      router.push("/home");

    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Login to Cycling Fantasy
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="identifier"
            type="text"
            placeholder="Username or Email"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            Login
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm">
          Don’t have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}