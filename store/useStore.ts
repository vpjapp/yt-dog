"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { YoutubeVideo, Channel } from "@/lib/youtube";

export type WatchedStatus = "unwatched" | "watched" | "skipped";

export interface VideoState extends YoutubeVideo {
  status: WatchedStatus;
}

export interface ChannelState extends Channel {
  addedAt: string; // ISO
}

interface StoreState {
  channels: ChannelState[];
  videosByChannel: Record<string, VideoState[]>; // channelId -> videos
  isFetching: boolean;

  addChannel: (inputUrl: string, resolved: ChannelState) => void;
  setVideos: (channelId: string, videos: YoutubeVideo[]) => void;
  markStatus: (channelId: string, videoId: string, status: WatchedStatus) => void;
  setIsFetching: (v: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      channels: [],
      videosByChannel: {},
      isFetching: false,

      addChannel: (inputUrl, resolved) =>
        set((s) => {
          const exists = s.channels.some((c) => c.id === resolved.id);
          if (exists) return s;
          return {
            ...s,
            channels: [
              ...s.channels,
              { ...resolved, url: inputUrl, addedAt: new Date().toISOString() },
            ],
          };
        }),

      setVideos: (channelId, videos) =>
        set((s) => {
          const prev = s.videosByChannel[channelId] || [];
          const map = new Map(prev.map((v) => [v.id, v] as const));
          for (const v of videos) {
            const existing = map.get(v.id);
            if (existing) {
              map.set(v.id, { ...existing, ...v });
            } else {
              map.set(v.id, { ...v, status: "unwatched" });
            }
          }
          return {
            ...s,
            videosByChannel: { ...s.videosByChannel, [channelId]: Array.from(map.values()) },
          };
        }),

      markStatus: (channelId, videoId, status) =>
        set((s) => {
          const list = s.videosByChannel[channelId] || [];
          return {
            ...s,
            videosByChannel: {
              ...s.videosByChannel,
              [channelId]: list.map((v) => (v.id === videoId ? { ...v, status } : v)),
            },
          };
        }),

      setIsFetching: (v) => set({ isFetching: v }),
    }),
    {
      name: "yt-dog-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ channels: s.channels, videosByChannel: s.videosByChannel }),
    }
  )
);

export function selectUnwatched(channelId: string, count = 10) {
  return (state: StoreState) => {
    const list = state.videosByChannel[channelId] || [];
    const unwatched = list.filter((v) => v.status !== "watched");
    // Latest first
    unwatched.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return unwatched.slice(0, count);
  };
}
