/**
 * Utility helpers for the OmniAnime app.
 */

/** Format large numbers with K/M suffix */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

/** Format a score out of 100 to "XX / 100" */
export function formatScore(score: number | null): string {
  if (!score) return 'N/A';
  return `${score} / 100`;
}

/** Get the status badge class name */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'RELEASING':
      return 'badge-releasing';
    case 'FINISHED':
      return 'badge-finished';
    default:
      return 'badge-not-yet';
  }
}

/** Format status text */
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    RELEASING: 'RELEASING',
    FINISHED: 'FINISHED',
    NOT_YET_RELEASED: 'NOT YET RELEASED',
    CANCELLED: 'CANCELLED',
    HIATUS: 'HIATUS',
  };
  return map[status] || status;
}

/** Format season + year */
export function formatSeason(season: string | null, year: number | null): string {
  if (!season || !year) return '';
  return `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;
}

/** Format a date object to "Month Year" */
export function formatDate(date: { year: number | null; month: number | null; day: number | null }): string {
  if (!date.year) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = date.month ? months[date.month - 1] : '';
  const day = date.day ? `${date.day}` : '';
  return `${month} ${day ? day + ', ' : ''}${date.year}`.trim();
}

/** Format aired date from ISO string */
export function formatAiredDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format seconds until airing to human-readable */
export function formatTimeUntilAiring(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Format unix timestamp */
export function formatAiringDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Truncate text to max length */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/** Strip HTML tags */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

/** Get current anime season */
export function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 1 && month <= 3) return { season: 'WINTER', year };
  if (month >= 4 && month <= 6) return { season: 'SPRING', year };
  if (month >= 7 && month <= 9) return { season: 'SUMMER', year };
  return { season: 'FALL', year };
}
