export type YouTubeThumbnail = {
  url: string;
  width: number;
  height: number;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  description?: string;
  publishedAt: string; // ISO
  thumbnails: {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
  channelId: string;
  channelTitle?: string;
  duration?: string; // ISO8601
  viewCount?: string;
};

export type VideosResponse = {
  items: YouTubeVideo[];
  nextPageToken?: string;
};

export type ResolveChannelResponse = {
  channelId: string;
  title?: string;
};
