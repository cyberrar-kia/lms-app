"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CourseSettings = { id: string; title: string; description: string; price: number };
type Module = { id: string; title: string; lessons: { id: string }[] };

export default function DashboardPage() {
  const [course, setCourse] = useState<CourseSettings | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile) setUserName(profile.full_name.split(" ")[0]);
      }

      const { data: cs } = await supabase.from("course_settings").select("*").single();
      if (cs) setCourse(cs);

      const { data: mods } = await supabase
        .from("modules")
        .select("id, title")
        .eq("published", true)
        .order("order_index");

      if (mods && mods.length > 0) {
        const { data: vids } = await supabase
          .from("videos")
          .select("id, module_id")
          .eq("published", true)
          .in("module_id", mods.map(m => m.id));

        const withLessons = mods.map(m => ({
          ...m,
          lessons: (vids || []).filter(v => v.module_id === m.id),
        }));
        setModules(withLessons);
        setTotalLessons((vids || []).length);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-brand text-xl">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl text-brand">LearnHub</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
          Log out
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="text-gray-500 mt-2">Ready to continue learning? Pick up where you left off.</p>
        </div>

        {/* Course Card */}
        {course ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Card Banner */}
            <div className="bg-gradient-to-br from-brand to-brand-dark h-48 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white"
                    style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, top: `${-20 + i * 10}%`, left: `${-10 + i * 20}%`, opacity: 0.3 }} />
                ))}
              </div>
              <div className="text-center z-10">
                <div className="text-5xl mb-3">🎓</div>
                <span className="text-white/80 text-sm font-medium uppercase tracking-widest">Your Course</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
                  {course.description && (
                    <p className="text-gray-500 leading-relaxed">{course.description}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-8 py-6 border-y border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Modules</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
                  <p className="text-xs text-gray-400 mt-1">Lessons</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">∞</p>
                  <p className="text-xs text-gray-400 mt-1">Lifetime Access</p>
                </div>
              </div>

              {/* Module Preview */}
              {modules.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What's inside</p>
                  <div className="space-y-2">
                    {modules.slice(0, 4).map((mod, i) => (
                      <div key={mod.id} className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="w-6 h-6 rounded-full bg-brand-light text-brand text-xs flex items-center justify-center font-semibold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{mod.title}</span>
                        <span className="ml-auto text-xs text-gray-400">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                    {modules.length > 4 && (
                      <p className="text-xs text-gray-400 pl-9">+{modules.length - 4} more modules inside</p>
                    )}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <Link href="/dashboard/course"
                className="block w-full bg-brand hover:bg-brand-dark text-white text-center font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-brand/20">
                {totalLessons === 0 ? "Preview Course →" : "Start Course →"}
              </Link>

              <p className="text-center text-xs text-gray-400 mt-4">
                You have full lifetime access to this course
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>No course available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
