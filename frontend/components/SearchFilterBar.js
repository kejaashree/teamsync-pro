"use client";

import { forwardRef } from "react";

const PRIORITIES = ["low", "medium", "high"];

const SearchFilterBar = forwardRef(function SearchFilterBar(
  { query, onQueryChange, priority, onPriorityChange, assignee, onAssigneeChange, members },
  ref
) {
  const hasActiveFilters = query || priority || assignee;

  return (
    <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center gap-2">
      <input
        ref={ref}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search cards… (press / to focus)"
        className="w-full min-w-[180px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />

      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <option value="">Any priority</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={assignee}
        onChange={(e) => onAssigneeChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <option value="">Anyone</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => {
            onQueryChange("");
            onPriorityChange("");
            onAssigneeChange("");
          }}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          Clear filters
        </button>
      )}
    </div>
  );
});

export default SearchFilterBar;
