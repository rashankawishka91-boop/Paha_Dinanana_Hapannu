import { NextResponse } from "next/server";

export const CHANNEL_ID = "UC3jTXU81jF9PfmO_PBi99ug";
export const CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;

const DEFAULT_CHANNEL_VIDEOS = [
  {
    videoId: "BbZdfLXfW9A",
    title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක්",
    url: "https://youtu.be/BbZdfLXfW9A",
    thumbnail: "https://i.ytimg.com/vi/BbZdfLXfW9A/hqdefault.jpg",
    subject: "පරිසරය (ප්‍රශ්න 100 විශේෂ විවරණය)",
    published: "2026-11-15"
  },
  {
    videoId: "murCwFZRlJo",
    title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය",
    url: "https://youtu.be/murCwFZRlJo",
    thumbnail: "https://i.ytimg.com/vi/murCwFZRlJo/hqdefault.jpg",
    subject: "190+ පේපර් සාකච්ඡාව (I හා II කොටස්)",
    published: "2026-10-25"
  }
];

export async function GET() {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const res = await fetch(feedUrl, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({
        channelId: CHANNEL_ID,
        channelTitle: "පහ දිනන හපන්නු",
        channelUrl: CHANNEL_URL,
        videos: DEFAULT_CHANNEL_VIDEOS
      });
    }

    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    const parsedVideos = entries
      .map((match) => {
        const block = match[1];
        const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
        const title = block.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
        const published = block.match(/<published>([^<]+)<\/published>/)?.[1]?.slice(0, 10);
        if (!videoId || !title) return null;
        return {
          videoId,
          title,
          url: `https://youtu.be/${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          subject: title.includes("පරිසරය") ? "පරිසරය" : "190+ පේපර් විවරණය",
          published: published || ""
        };
      })
      .filter(Boolean);

    // Ensure the two highlighted videos are always included
    const videoMap = new Map();
    DEFAULT_CHANNEL_VIDEOS.forEach(v => videoMap.set(v.videoId, v));
    parsedVideos.forEach(v => {
      if (!videoMap.has(v.videoId)) {
        videoMap.set(v.videoId, v);
      }
    });

    return NextResponse.json({
      channelId: CHANNEL_ID,
      channelTitle: "පහ දිනන හපන්නු",
      channelUrl: CHANNEL_URL,
      videos: Array.from(videoMap.values())
    });
  } catch (err) {
    return NextResponse.json({
      channelId: CHANNEL_ID,
      channelTitle: "පහ දිනන හපන්නු",
      channelUrl: CHANNEL_URL,
      videos: DEFAULT_CHANNEL_VIDEOS
    });
  }
}
