/** Turns any YouTube link into an embeddable URL. Returns "" if it can't. */
export function toYouTubeEmbed(url: string): string {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{6,})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com\/live\/)([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1`;
    }
  }
  return '';
}

/** Turns any Spotify link into an embeddable URL. Returns "" if it can't. */
export function toSpotifyEmbed(url: string): string {
  if (!url) return '';
  const m = url.match(
    /spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/,
  );
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : '';
}

/**
 * Google Drive share links are not directly embeddable. This converts the
 * common "/file/d/<id>/view" form into a URL that usually works as an image.
 * Returns "" when the link isn't a recognisable Drive file link.
 */
export function toDriveDirectUrl(url: string): string {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{10,})/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : '';
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export function pickRandom<T>(items: readonly T[], avoid?: T): T {
  if (items.length === 0) throw new Error('pickRandom needs at least one item');
  if (items.length === 1) return items[0];
  let next = items[Math.floor(Math.random() * items.length)];
  let guard = 0;
  while (avoid !== undefined && next === avoid && guard < 8) {
    next = items[Math.floor(Math.random() * items.length)];
    guard += 1;
  }
  return next;
}
