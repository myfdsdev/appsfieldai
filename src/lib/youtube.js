// Extract a YouTube video ID from any common YouTube URL format.
export function getYouTubeId(url) {
  if (!url) return "";
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : "";
}