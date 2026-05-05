"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function CreatorHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-bold text-xl text-brand">LearnHub Creator</span>
        <nav className="flex gap-6 text-sm">
          <Link href="/creator" className="text-gray-600 hover:text-brand transition-colors">Overview</Link>
          <Link href="/creator/curriculum" className="text-gray-600 hover:text-brand transition-colors">Course Builder</Link>
          <Link href="/creator/students" className="text-gray-600 hover:text-brand transition-colors">Students</Link>
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-500 transition-colors">
        Log out
      </button>
    </header>
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CreatorHeader />
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
