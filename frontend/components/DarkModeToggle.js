"use client";

import { useEffect, useState } from "react";
import { getTheme, toggleTheme } from "../lib/theme";

export default function DarkModeToggle() {
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  return (
    <button
      onClick={() => setThemeState(toggleTheme())}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="rounded-lg border border-gray-300 bg-white p-1.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <span className="block w-4 text-center transition-transform duration-200" key={theme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
