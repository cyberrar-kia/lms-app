"use client";
import { useRef, useState } from "react";

export default function VideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video"
      onContextMenu={e => e.preventDefault()}>
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <p className="text-white/70 text-sm">Video failed to load.</p>
          <button onClick={() => { setError(false); videoRef.current?.load(); }}
            className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={url}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          playsInline
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
