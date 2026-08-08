"use client";

const TAG_COLORS = {
  design: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  backend: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  frontend: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  bug: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
};

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
};

function tagColor(tag) {
  return TAG_COLORS[(tag || "").toLowerCase()] || TAG_COLORS.default;
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = date < today;
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, overdue };
}

export default function Card({ card, columnId, onDragStart, onDelete, onOpen, exiting }) {
  const due = formatDueDate(card.dueDate);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card._id, columnId)}
      onClick={() => onOpen(card)}
      className={`mb-2 cursor-grab rounded-lg border border-gray-200 bg-white p-3 text-sm card-shadow transition-shadow duration-150 hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800 ${
        exiting ? "animate-card-out" : "animate-card-in"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-gray-800 dark:text-gray-100">{card.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card._id);
          }}
          aria-label="Delete card"
          className="shrink-0 text-gray-300 transition hover:scale-125 hover:text-red-500 dark:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {card.tag && (
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tagColor(card.tag)}`}>
            {card.tag}
          </span>
        )}
        {card.priority && (
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[card.priority]}`}>
            {card.priority}
          </span>
        )}
        {due && (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              due.overdue
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {due.overdue ? `Overdue ${due.label}` : due.label}
          </span>
        )}
      </div>

      {card.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="avatar bg-brand-500 !h-5 !w-5 !border-0 !text-[9px]">{initials(card.assignee.name)}</div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{card.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
