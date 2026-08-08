"use client";

const VARIANT_STYLES = {
  info: "border-l-4 border-brand-500",
  error: "border-l-4 border-red-500"
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-toast-in pointer-events-auto rounded-lg bg-white px-3 py-2.5 text-sm text-gray-700 card-shadow dark:bg-gray-800 dark:text-gray-200 ${
            VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="leading-snug">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-gray-300 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
