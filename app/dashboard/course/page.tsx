"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";

type Lesson = { id: string; title: string; description: string; storage_path: string; order_index: number; module_id: string };
type Module = { id: string; title: string; order_index: number; lessons: Lesson[] };

export default function CoursePage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("Your Course");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: cs } = await supabase.from("course_settings").select("title").single();
      if (cs) setCourseTitle(cs.title);

      const { data: mods } = await supabase
        .from("modules").select("*").eq("published", true).order("order_index");

      if (!mods || mods.length === 0) { setLoading(false); return; }

      const { data: vids } = await supabase
        .from("videos").select("*").eq("published", true)
        .in("module_id", mods.map((m: Module) => m.id)).order("order_index");

      const withLessons = mods.map((m: Module) => ({
        ...m, lessons: (vids || []).filter((v: Lesson) => v.module_id === m.id),
      }));

      setModules(withLessons);
      const firstMod = withLessons.find(m => m.lessons.length > 0);
      if (firstMod) {
        setExpandedModule(firstMod.id);
        await selectLesson(firstMod.lessons[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function selectLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    setSignedUrl(null);
    setUrlError("");
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("course-videos").createSignedUrl(lesson.storage_path, 3600);
    if (error || !data?.signedUrl) { setUrlError("Could not load video. Please try again."); return; }
    setSignedUrl(data.signedUrl);
  }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const lessonIndex = modules.flatMap(m => m.lessons).findIndex(l => l.id === activeLesson?.id);
  const allLessons = modules.flatMap(m => m.lessons);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-brand text-xl">Loading course...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
            ← Back
          </Link>
          <div className="w-px h-4 bg-gray-700" />
          <span className="text-white font-semibold text-sm">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          {activeLesson && (
            <span className="text-gray-400 text-xs">
              Lesson {lessonIndex + 1} of {totalLessons}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 overflow-y-auto flex-shrink-0 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Content</p>
            <p className="text-xs text-gray-500 mt-1">{modules.length} modules · {totalLessons} lessons</p>
          </div>

          <div className="p-2">
            {modules.map((mod, modIndex) => (
              <div key={mod.id} className="mb-1">
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between hover:bg-gray-700/50 transition-colors group">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Module {modIndex + 1}</p>
                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white">{mod.title}</p>
                  </div>
                  <span className="text-gray-500 text-xs ml-2">{expandedModule === mod.id ? "▲" : "▼"}</span>
                </button>

                {expandedModule === mod.id && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {mod.lessons.length === 0 && (
                      <p className="text-xs text-gray-500 px-4 py-2">No lessons yet.</p>
                    )}
                    {mod.lessons.map((lesson, li) => {
                      const isActive = activeLesson?.id === lesson.id;
                      return (
                        <button key={lesson.id} onClick={() => selectLesson(lesson)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-brand text-white" : "hover:bg-gray-700/50 text-gray-400 hover:text-white"}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-semibold ${isActive ? "bg-white text-brand" : "bg-gray-700 text-gray-400"}`}>
                            {li + 1}
                          </span>
                          <span className="text-sm leading-snug">{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {modules.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm px-4">
                No content available yet.
              </div>
            )}
          </div>
        </aside>

        {/* Main video area */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {activeLesson ? (
            <div className="p-6 max-w-4xl mx-auto">
              {/* Video */}
              {urlError ? (
                <div className="aspect-video bg-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <p className="text-gray-400 text-sm">{urlError}</p>
                  <button onClick={() => selectLesson(activeLesson)}
                    className="text-sm bg-brand text-white px-4 py-2 rounded-lg">Try Again</button>
                </div>
              ) : signedUrl ? (
                <VideoPlayer url={signedUrl} />
              ) : (
                <div className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center">
                  <div className="animate-pulse text-gray-500">Loading video...</div>
                </div>
              )}

              {/* Lesson info */}
              <div className="mt-6 flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white mb-2">{activeLesson.title}</h1>
                  {activeLesson.description && (
                    <p className="text-gray-400 text-sm leading-relaxed">{activeLesson.description}</p>
                  )}
                </div>
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={() => { if (lessonIndex > 0) selectLesson(allLessons[lessonIndex - 1]); }}
                  disabled={lessonIndex <= 0}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Previous Lesson
                </button>
                <span className="text-xs text-gray-600">{lessonIndex + 1} / {totalLessons}</span>
                <button
                  onClick={() => { if (lessonIndex < allLessons.length - 1) selectLesson(allLessons[lessonIndex + 1]); }}
                  disabled={lessonIndex >= allLessons.length - 1}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next Lesson →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">🎬</div>
                <p>Select a lesson from the sidebar to start watching.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
