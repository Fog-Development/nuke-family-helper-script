// Format a Date as "YYYY-MM-DD HH:mm"
export function formatDateTime(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Rough "time ago" string (e.g. "2 hours ago")
export function timeSince(dateObj) {
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.secs);
    if (count >= 1) {
      return count === 1
        ? `${count} ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }
  return "just now";
}

// Parse an API datetime string ("YYYY-MM-DD HH:MM:SS", UTC) into a Date.
export function parseApiUtcDate(value) {
  if (!value) return null;
  return new Date(value.replace(" ", "T") + "Z");
}
