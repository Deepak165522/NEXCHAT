export default function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return "";

  const diff = Date.now() - time;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
}
