"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type CourseSettings = { id: string; title: string; description: string; price: number; currency: string };
type Lesson = { id: string; title: string; description: string; storage_path: string; order_index: number; published: boolean; module_id: string };
type Module = { id: string; title: string; description: string; order_index: number; published: boolean; lessons?: Lesson[] };

export default function CurriculumPage() {
  const supabase = createClient();
  const [course, setCourse] = useState<CourseSettings | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingLesson, setUploadingLesson] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // New module/lesson form state
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [newLesson, setNewLesson] = useState<Record<string, { title: string; description: string }>>({});
  const [addingLesson, setAddingLesson] = useState<string | null>(null);

  async function loadAll() {
    const [{ data: cs }, { data: mods }] = await Promise.all([
      supabase.from("course_settings").select("*").single(),
      supabase.from("modules").select("*").order("order_index"),
    ]);
    if (cs) setCourse(cs);

    if (mods && mods.length > 0) {
      const { data: vids } = await supabase
        .from("videos")
        .select("*")
        .in("module_id", mods.map((m: Module) => m.id))
        .order("order_index");

      const withLessons = mods.map((m: Module) => ({
        ...m,
        lessons: (vids || []).filter((v: Lesson) => v.module_id === m.id),
      }));
      setModules(withLessons);
    } else {
      setModules([]);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  // Save course settings
  async function saveCourse() {
    if (!course) return;
    setSaving(true);
    const { error } = await supabase
      .from("course_settings")
      .update({ title: course.title, description: course.description, price: course.price })
      .eq("id", course.id);
    setSaving(false);
    if (error) showMsg("error", error.message);
    else showMsg("success", "Course settings saved!");
  }

  // Add module
  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const { error } = await supabase.from("modules").insert({
      title: newModuleTitle.trim(),
      order_index: modules.length,
      published: true,
    });
    setAddingModule(false);
    if (error) showMsg("error", error.message);
    else {
      setNewModuleTitle("");
      showMsg("success", "Module added!");
      await loadAll();
    }
  }

  // Delete module
  async function deleteModule(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    await supabase.from("videos").delete().eq("module_id", id);
    await supabase.from("modules").delete().eq("id", id);
    showMsg("success", "Module deleted.");
    await loadAll();
  }

  // Toggle module publish
  async function toggleModule(id: string, published: boolean) {
    await supabase.from("modules").update({ published: !published }).eq("id", id);
    await loadAll();
  }

  // Add lesson (video upload)
  async function uploadLesson(moduleId: string, file: File) {
    const lessonData = newLesson[moduleId];
    if (!lessonData?.title.trim()) {
      showMsg("error", "Please enter a lesson title first.");
      return;
    }
    setUploadingLesson(moduleId);
    setUploadProgress(10);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await file.arrayBuffer();

    setUploadProgress(40);
    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) {
      setUploadingLesson(null);
      setUploadProgress(0);
      return showMsg("error", `Upload failed: ${uploadError.message}`);
    }

    setUploadProgress(80);
    const mod = modules.find(m => m.id === moduleId);
    const { error: dbError } = await supabase.from("videos").insert({
      module_id: moduleId,
      title: lessonData.title.trim(),
      description: lessonData.description || "",
      storage_path: fileName,
      order_index: (mod?.lessons?.length || 0),
      published: true,
    });

    setUploadProgress(100);
    setUploadingLesson(null);
    setUploadProgress(0);

    if (dbError) return showMsg("error", dbError.message);

    setNewLesson(prev => ({ ...prev, [moduleId]: { title: "", description: "" } }));
    setAddingLesson(null);
    showMsg("success", "Lesson uploaded!");
    await loadAll();
  }

  // Delete lesson
  async function deleteLesson(id: string, storagePath: string) {
    if (!confirm("Delete this lesson?")) return;
    await supabase.storage.from("course-videos").remove([storagePath]);
    await supabase.from("videos").delete().eq("id", id);
    showMsg("success", "Lesson deleted.");
    await loadAll();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-brand text-lg">Loading curriculum...</div>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Course Builder</h1>
      <p className="text-gray-500 mb-8">Set up your course details and build your curriculum.</p>

      {msg && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* COURSE SETTINGS */}
      {course && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6">📋 Course Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
              <input
                type="text" value={course.title}
                onChange={e => setCourse({ ...course, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
                placeholder="e.g. Digital Marketing Masterclass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Description</label>
              <textarea
                value={course.description || ""} rows={4}
                onChange={e => setCourse({ ...course, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand resize-none"
                placeholder="Describe what students will learn..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Price (₦)</label>
              <input
                type="number" value={course.price}
                onChange={e => setCourse({ ...course, price: parseInt(e.target.value) || 0 })}
                className="w-48 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
              />
            </div>
            <button onClick={saveCourse} disabled={saving}
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Course Settings"}
            </button>
          </div>
        </div>
      )}

      {/* CURRICULUM BUILDER */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">📚 Curriculum</h2>
          <span className="text-sm text-gray-400">{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Module list */}
        <div className="space-y-4 mb-8">
          {modules.length === 0 && (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              No modules yet. Add your first module below.
            </div>
          )}

          {modules.map((mod, modIndex) => (
            <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Module header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="flex items-center gap-3 text-left flex-1">
                  <span className="text-gray-400 text-sm font-mono">M{modIndex + 1}</span>
                  <span className="font-semibold text-gray-800">{mod.title}</span>
                  <span className="text-xs text-gray-400">({mod.lessons?.length || 0} lessons)</span>
                  <span className="ml-auto text-gray-400">{expandedModule === mod.id ? "▲" : "▼"}</span>
                </button>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => toggleModule(mod.id, mod.published)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${mod.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {mod.published ? "Live" : "Hidden"}
                  </button>
                  <button onClick={() => deleteModule(mod.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {expandedModule === mod.id && (
                <div className="p-5 space-y-3">
                  {(mod.lessons || []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No lessons yet. Add one below.</p>
                  )}

                  {(mod.lessons || []).map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs font-mono">L{lessonIndex + 1}</span>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{lesson.title}</p>
                          {lesson.description && <p className="text-xs text-gray-400">{lesson.description}</p>}
                        </div>
                      </div>
                      <button onClick={() => deleteLesson(lesson.id, lesson.storage_path)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors ml-4">
                        Delete
                      </button>
                    </div>
                  ))}

                  {/* Add lesson form */}
                  {addingLesson === mod.id ? (
                    <div className="border border-brand/30 rounded-xl p-4 space-y-3 bg-brand-light/30">
                      <p className="text-sm font-semibold text-brand">New Lesson</p>
                      <input
                        type="text" placeholder="Lesson title *"
                        value={newLesson[mod.id]?.title || ""}
                        onChange={e => setNewLesson(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], title: e.target.value, description: prev[mod.id]?.description || "" } }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                      />
                      <input
                        type="text" placeholder="Lesson description (optional)"
                        value={newLesson[mod.id]?.description || ""}
                        onChange={e => setNewLesson(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], description: e.target.value, title: prev[mod.id]?.title || "" } }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                      />

                      {/* Video upload */}
                      <div
                        onClick={() => fileRefs.current[mod.id]?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-brand rounded-xl p-6 text-center cursor-pointer transition-colors">
                        <p className="text-2xl mb-1">🎬</p>
                        <p className="text-sm text-gray-500">Click to select video file</p>
                        <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV — up to 500MB</p>
                      </div>
                      <input
                        ref={el => { fileRefs.current[mod.id] = el; }}
                        type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadLesson(mod.id, f); }}
                      />

                      {uploadingLesson === mod.id && (
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => setAddingLesson(null)}
                          className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingLesson(mod.id); setExpandedModule(mod.id); }}
                      className="w-full text-sm text-brand border-2 border-dashed border-brand/30 hover:border-brand rounded-xl py-3 transition-colors">
                      + Add Lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add module form */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Add New Module</p>
          <div className="flex gap-3">
            <input
              type="text" placeholder="Module title e.g. Introduction to Marketing"
              value={newModuleTitle}
              onChange={e => setNewModuleTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addModule()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
            <button onClick={addModule} disabled={addingModule || !newModuleTitle.trim()}
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap">
              {addingModule ? "Adding..." : "+ Add Module"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
