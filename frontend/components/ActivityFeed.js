"use client";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ open, onClose, activity }) {
  if (!open) return null;

  const items = (activity || []).slice().reverse();

  return (
    <>
      <div
        onClick={onClose}
        className="animate-fade-in fixed inset-0 z-40 bg-black/20"
        aria-hidden="true"
      />
      <aside className="animate-panel-in fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</h2>
          <button
            onClick={onClose}
            aria-label="Close activity feed"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Nothing has happened on this board yet.
            </p>
          )}

          <ul className="space-y-3">
            {items.map((entry, idx) => (
              <li key={entry._id || idx} className="animate-fade-in text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{entry.actorName}</span>{" "}
                  {entry.message}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {timeAgo(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
