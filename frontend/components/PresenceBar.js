"use client";

const COLORS = ["#4f46e5", "#0f766e", "#b91c1c", "#a16207", "#0369a1", "#7c3aed"];

function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function PresenceBar({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="avatar animate-pop-in"
            style={{ backgroundColor: colorFor(u.id || u.name || "x") }}
            title={u.name}
          >
            {initials(u.name)}
          </div>
        ))}
      </div>
      <span className="ml-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="animate-pulse-dot h-2 w-2 rounded-full bg-green-500" />
        live
      </span>
    </div>
  );
}
