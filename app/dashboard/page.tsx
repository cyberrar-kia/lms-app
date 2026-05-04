"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";

type Video = { id: string; title: string; description: string; storage_path: string; order_index: number };

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("videos").select("*").eq("published", true).order("order_index");
      if (data && data.length > 0) {
        setVideos(data);
        setActiveVideo(data[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function getUrl() {
      if (!activeVideo) return;
      const res = await fetch(`/api/videos/signed-url?path=${encodeURIComponent(activeVideo.storage_path)}`);
      const data = await res.json();
      setSignedUrl(data.url);
    }
    getUrl();
  }, [activeVideo]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl text-brand">LearnHub</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Log out</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-100 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Content</p>
          </div>
          <div className="p-2">
            {videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVideo(v)}
                className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors ${activeVideo?.id === v.id ? "bg-brand-light text-brand font-medium" : "hover:bg-gray-50 text-gray-700"}`}
              >
                <span className="text-xs text-gray-400 block mb-0.5">Lesson {i + 1}</span>
                {v.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeVideo && (
            <>
              <h1 className="text-2xl font-bold mb-2">{activeVideo.title}</h1>
              {activeVideo.description && <p className="text-gray-500 mb-6">{activeVideo.description}</p>}
              {signedUrl ? <VideoPlayer url={signedUrl} /> : (
                <div className="aspect-video bg-gray-200 rounded-2xl flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading video...</div>
                </div>
              )}
            </>
          )}
          {videos.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🎬</div>
              <p>No videos uploaded yet. Check back soon!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
