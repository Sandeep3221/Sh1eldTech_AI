"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input, Label, Card } from "../components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <Card className="w-full max-w-[400px] p-8 sm:p-10 border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 relative shadow-sm border border-gray-100">
            <Image 
              src="/logo.jpg" 
              alt="Shield AI Logo" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to your Shield Tech account</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="admin@shield.local" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
