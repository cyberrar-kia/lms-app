"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = { id: string; title: string; description: string; storage_path: string; order_index: number; module_id: string };
type Module = { id: string; title: string; description: string; order_index: number; published: boolean; lessons: Lesson[] };
type CourseSettings = { id: string; title: string; description: string; price: number };

export default function CurriculumPage() {
  const [course, setCourse] = useState<CourseSettings | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Module form
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  // Lesson form — one per module, tracked by moduleId
  const [lessonForms, setLessonForms] = useState<Record<string, { title: string; description: string; uploading: boolean; progress: number }>>({});
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadModuleId, setActiveUploadModuleId] = useState<string | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function loadAll() {
    const supabase = createClient();
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

      setModules(mods.map((m: Module) => ({
        ...m,
        lessons: (vids || []).filter((v: Lesson) => v.module_id === m.id),
      })));
    } else {
      setModules([]);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Init lesson form for a module
  function initLessonForm(moduleId: string) {
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: prev[moduleId] || { title: "", description: "", uploading: false, progress: 0 }
    }));
    setShowLessonForm(moduleId);
    setExpandedModule(moduleId);
  }

  function updateLessonForm(moduleId: string, field: string, value: string) {
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value }
    }));
  }

  function resetLessonForm(moduleId: string) {
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: { title: "", description: "", uploading: false, progress: 0 }
    }));
    setShowLessonForm(null);
  }

  async function saveCourse() {
    if (!course) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("course_settings")
      .update({ title: course.title, description: course.description, price: course.price })
      .eq("id", course.id);
    setSaving(false);
    if (error) showMsg("error", error.message);
    else showMsg("success", "Course settings saved!");
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const supabase = createClient();
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

  async function deleteModule(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    const supabase = createClient();
    // Delete videos from storage first
    const mod = modules.find(m => m.id === id);
    if (mod?.lessons?.length) {
      await supabase.storage.from("course-videos").remove(mod.lessons.map(l => l.storage_path));
    }
    await supabase.from("videos").delete().eq("module_id", id);
    await supabase.from("modules").delete().eq("id", id);
    showMsg("success", "Module deleted.");
    await loadAll();
  }

  async function toggleModule(id: string, published: boolean) {
    const supabase = createClient();
    await supabase.from("modules").update({ published: !published }).eq("id", id);
    await loadAll();
  }

  // Trigger file picker for a specific module
  function triggerUpload(moduleId: string) {
    const form = lessonForms[moduleId];
    if (!form?.title?.trim()) {
      showMsg("error", "Please enter a lesson title first.");
      return;
    }
    setActiveUploadModuleId(moduleId);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const moduleId = activeUploadModuleId;
    if (!file || !moduleId) return;

    // Reset file input immediately so same file can be selected again
    e.target.value = "";

    const form = lessonForms[moduleId];
    if (!form?.title?.trim()) {
      showMsg("error", "Please enter a lesson title first.");
      return;
    }

    // Set uploading state
    setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], uploading: true, progress: 10 } }));

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await file.arrayBuffer();

    setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], progress: 40 } }));

    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) {
      setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], uploading: false, progress: 0 } }));
      showMsg("error", `Upload failed: ${uploadError.message}`);
      return;
    }

    setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], progress: 80 } }));

    const mod = modules.find(m => m.id === moduleId);
    const { error: dbError } = await supabase.from("videos").insert({
      module_id: moduleId,
      title: form.title.trim(),
      description: form.description || "",
      storage_path: fileName,
      order_index: mod?.lessons?.length || 0,
      published: true,
    });

    if (dbError) {
      setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], uploading: false, progress: 0 } }));
      showMsg("error", dbError.message);
      return;
    }

    // Success — reset form but keep it open so they can add another lesson
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: { title: "", description: "", uploading: false, progress: 100 }
    }));
    setTimeout(() => {
      setLessonForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], progress: 0 } }));
    }, 1000);

    showMsg("success", "Lesson uploaded! You can add another lesson below.");
    await loadAll();
  }

  async function deleteLesson(id: string, storagePath: string) {
    if (!confirm("Delete this lesson?")) return;
    const supabase = createClient();
    await supabase.storage.from("course-videos").remove([storagePath]);
    await supabase.from("videos").delete().eq("id", id);
    showMsg("success", "Lesson deleted.");
    await loadAll();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-brand text-lg">Loading...</div>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Course Builder</h1>
      <p className="text-gray-500 mb-8">Set up your course and build your curriculum.</p>

      {msg && (
        <div className={`rounded-xl p-4 mb-6 text-sm font-medium ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* Hidden global file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* COURSE SETTINGS */}
      {course && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-6">📋 Course Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
              <input type="text" value={course.title}
                onChange={e => setCourse({ ...course, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
                placeholder="e.g. Digital Marketing Masterclass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Description</label>
              <textarea value={course.description || ""} rows={3}
                onChange={e => setCourse({ ...course, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand resize-none"
                placeholder="Describe what students will learn..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (₦)</label>
              <input type="number" value={course.price}
                onChange={e => setCourse({ ...course, price: parseInt(e.target.value) || 0 })}
                className="w-40 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
              />
            </div>
            <button onClick={saveCourse} disabled={saving}
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* CURRICULUM */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">📚 Curriculum</h2>
          <span className="text-sm text-gray-400">{modules.length} modules · {modules.reduce((a, m) => a + m.lessons.length, 0)} lessons</span>
        </div>

        <div className="space-y-4 mb-8">
          {modules.length === 0 && (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              No modules yet. Add your first module below.
            </div>
          )}

          {modules.map((mod, modIndex) => {
            const form = lessonForms[mod.id] || { title: "", description: "", uploading: false, progress: 0 };
            const isExpanded = expandedModule === mod.id;
            const isAddingLesson = showLessonForm === mod.id;

            return (
              <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Module Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                  <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                    className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">M{modIndex + 1}</span>
                    <span className="font-semibold text-gray-800">{mod.title}</span>
                    <span className="text-xs text-gray-400">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                    <span className="ml-auto text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </button>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => toggleModule(mod.id, mod.published)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${mod.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {mod.published ? "Live" : "Hidden"}
                    </button>
                    <button onClick={() => deleteModule(mod.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Module Body */}
                {isExpanded && (
                  <div className="p-5">
                    {/* Lesson list */}
                    <div className="space-y-2 mb-4">
                      {mod.lessons.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-3">No lessons yet.</p>
                      )}
                      {mod.lessons.map((lesson, li) => (
                        <div key={lesson.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-brand text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{li + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{lesson.title}</p>
                              {lesson.description && <p className="text-xs text-gray-400">{lesson.description}</p>}
                            </div>
                          </div>
                          <button onClick={() => deleteLesson(lesson.id, lesson.storage_path)}
                            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 ml-4 flex-shrink-0">
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Lesson */}
                    {!isAddingLesson ? (
                      <button onClick={() => initLessonForm(mod.id)}
                        className="w-full text-sm text-brand border-2 border-dashed border-brand/30 hover:border-brand rounded-xl py-3 transition-colors">
                        + Add Lesson to this Module
                      </button>
                    ) : (
                      <div className="border border-brand/20 rounded-xl p-4 bg-brand-light/20 space-y-3">
                        <p className="text-sm font-semibold text-brand">New Lesson</p>
                        <input
                          type="text"
                          placeholder="Lesson title *"
                          value={form.title}
                          onChange={e => updateLessonForm(mod.id, "title", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={form.description}
                          onChange={e => updateLessonForm(mod.id, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
                        />

                        {form.uploading ? (
                          <div className="space-y-2">
                            <p className="text-sm text-brand font-medium">Uploading...</p>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${form.progress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerUpload(mod.id)}
                            disabled={!form.title.trim()}
                            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                            📹 Select Video & Upload
                          </button>
                        )}

                        <button onClick={() => resetLessonForm(mod.id)}
                          className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Module */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Add New Module</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Introduction to the Course"
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
