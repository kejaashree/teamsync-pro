"use client";

import { useState } from "react";
import Card from "./Card";

export default function Column({
  column,
  cards,
  totalCardCount,
  onDragStart,
  onDrop,
  onDelete,
  onAddCard,
  onOpenCard,
  onRenameColumn,
  onDeleteColumn
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [priority, setPriority] = useState("medium");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCard(column._id, { title: title.trim(), tag: tag.trim(), priority });
    setTitle("");
    setTag("");
    setAdding(false);
  }

  function handleRename(e) {
    e.preventDefault();
    if (!name.trim() || name.trim() === column.name) {
      setRenaming(false);
      return;
    }
    onRenameColumn(column._id, name.trim());
    setRenaming(false);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, column._id, totalCardCount);
      }}
      className={`flex min-w-[260px] flex-1 flex-col rounded-xl bg-gray-100 p-3 transition-colors sm:min-w-0 dark:bg-gray-800/60 ${
        dragOver ? "drag-over" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        {renaming ? (
          <form onSubmit={handleRename} className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              className="w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </form>
        ) : (
          <h3
            onClick={() => setRenaming(true)}
            className="cursor-text text-sm font-medium text-gray-700 dark:text-gray-200"
            title="Click to rename"
          >
            {column.name}
          </h3>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {cards.length}
            {cards.length !== totalCardCount ? ` / ${totalCardCount}` : ""}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Column options"
              className="rounded px-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              ⋮
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="animate-fade-in absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg bg-white text-left card-shadow dark:bg-gray-900"
              >
                <button
                  onClick={() => {
                    onDeleteColumn(column._id);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-[40px]">
        {cards.map((card, idx) => (
          <div
            key={card._id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.stopPropagation();
              setDragOver(false);
              onDrop(e, column._id, card.order);
            }}
          >
            <Card
              card={card}
              columnId={column._id}
              onDragStart={onDragStart}
              onDelete={onDelete}
              onOpen={onOpenCard}
              exiting={card.exiting}
            />
          </div>
        ))}
        {cards.length === 0 && totalCardCount > 0 && (
          <p className="px-1 py-2 text-xs italic text-gray-400 dark:text-gray-600">No cards match the filters</p>
        )}
      </div>

      {adding ? (
        <form onSubmit={handleSubmit} className="animate-fade-in mt-1 space-y-2 rounded-lg bg-white p-2 card-shadow dark:bg-gray-900">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option>
          </select>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag (optional)"
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Priority, due date and assignee can be set after — click the card once it's added.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-700 active:scale-95"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 rounded-lg px-2 py-1.5 text-left text-sm text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
