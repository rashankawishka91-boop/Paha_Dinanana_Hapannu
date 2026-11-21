"use client";
import React from "react";
import { getYoutubeEmbedUrl } from "../lib/Provider";

export default function VideoPlayer({ url, title = "Video Lesson", className = "", style = {} }) {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div
      className={`site-video-container ${className}`}
      style={{
        position: "relative",
        paddingBottom: "56.25%", // 16:9 aspect ratio
        height: 0,
        overflow: "hidden",
        borderRadius: "12px",
        background: "#0a0a0c",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        border: "1px solid rgba(245, 166, 35, 0.3)",
        ...style
      }}
    >
      <iframe
        src={embedUrl}
        allowFullScreen
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    </div>
  );
}

