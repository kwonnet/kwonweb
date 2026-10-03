/** Cloudflare Stream playback uses the saved URLs, with UID-based fallbacks. */
export function videoPlayback(media: {
  videoId: string;
  thumbnail: string;
  url?: string;
}) {
  const { videoId, thumbnail, url } = media;
  const base = `https://videodelivery.net/${encodeURIComponent(videoId)}`;
  const poster = thumbnail || `${base}/thumbnails/thumbnail.jpg`;
  return {
    videoId,
    thumbnail,
    hlsUrl: url || `${base}/manifest/video.m3u8`,
    poster,
    previewUrl: poster,
  };
}
