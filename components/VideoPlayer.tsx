"use client";
import { useRef } from "react";

export default function VideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video"
      onContextMenu={e => e.preventDefault()}>
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload"
        className="w-full h-full"
        playsInline
      />
    </div>
  );
}
