"use client";
import { useState, useRef } from "react";

export default function UploadPage() {
  const [form, setForm] = useState({ title: "", description: "", order_index: "1" });
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Please select a video file.");
    setError("");
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("order_index", form.order_index);

    setProgress(40);
    const res = await fetch("/api/videos/upload", { method: "POST", body: formData });
    setProgress(90);
    const data = await res.json();
    setUploading(false);
    setProgress(100);

    if (!res.ok) return setError(data.error || "Upload failed.");
    setSuccess(true);
    setForm({ title: "", description: "", order_index: "1" });
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setTimeout(() => setProgress(0), 1000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
      <p className="text-gray-500 mb-8">Add a new lesson to your course.</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6">
          ✅ Video uploaded successfully! It's now live in your course.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
          <input type="text" required placeholder="e.g. Introduction to the Course"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea placeholder="Brief description of this lesson..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Order</label>
          <input type="number" min="1" required
            value={form.order_index} onChange={e => setForm({ ...form, order_index: e.target.value })}
            className="w-32 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video File *</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-brand rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            {file ? (
              <p className="text-gray-700 font-medium">{file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)</p>
            ) : (
              <>
                <p className="text-4xl mb-2">🎬</p>
                <p className="text-gray-500">Click to select a video file</p>
                <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV — up to 500MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={uploading}
          className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
