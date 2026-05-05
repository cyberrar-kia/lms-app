"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";

type Lesson = { id: string; title: string; description: string; storage_path: string; order_index: number; module_id: string };
type Module = { id: string; title: string; order_index: number; lessons: Lesson[] };

export default function DashboardPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: mods } = await supabase
        .from("modules")
        .select("*")
        .eq("published", true)
        .order("order_index");

      if (!mods || mods.length === 0) { setLoading(false); return; }

      const { data: vids } = await supabase
        .from("videos")
        .select("*")
        .eq("published", true)
        .in("module_id", mods.map((m: Module) => m.id))
        .order("order_index");

      const withLessons = mods.map((m: Module) => ({
        ...m,
        lessons: (vids || []).filter((v: Lesson) => v.module_id === m.id),
      }));

      setModules(withLessons);

      // Auto-select first lesson
      const firstLesson = withLessons[0]?.lessons[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
        setExpandedModule(withLessons[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function getUrl() {
      if (!activeLesson) return;
      const res = await fetch(`/api/videos/signed-url?path=${encodeURIComponent(activeLesson.storage_path)}`);
      const data = await res.json();
      setSignedUrl(data.url);
    }
    getUrl();
  }, [activeLesson]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-brand text-xl">Loading your course...</div>
    </div>
  );

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl text-brand">LearnHub</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Log out</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Content</p>
            <p className="text-xs text-gray-400 mt-1">{modules.length} modules · {totalLessons} lessons</p>
          </div>

          <div className="p-2">
            {modules.map((mod, modIndex) => (
              <div key={mod.id} className="mb-2">
                {/* Module header */}
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Module {modIndex + 1}</p>
                    <p className="text-sm font-semibold text-gray-800">{mod.title}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{expandedModule === mod.id ? "▲" : "▼"}</span>
                </button>

                {/* Lessons */}
                {expandedModule === mod.id && (
                  <div className="ml-2 mt-1 space-y-1">
                    {mod.lessons.map((lesson, lessonIndex) => (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); setSignedUrl(null); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${activeLesson?.id === lesson.id ? "bg-brand-light text-brand" : "hover:bg-gray-50 text-gray-700"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${activeLesson?.id === lesson.id ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
                          {lessonIndex + 1}
                        </span>
                        <span className="text-sm">{lesson.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeLesson ? (
            <>
              <h1 className="text-2xl font-bold mb-2">{activeLesson.title}</h1>
              {activeLesson.description && <p className="text-gray-500 mb-6">{activeLesson.description}</p>}
              {signedUrl ? (
                <VideoPlayer url={signedUrl} />
              ) : (
                <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading video...</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🎬</div>
              <p>No lessons available yet. Check back soon!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
