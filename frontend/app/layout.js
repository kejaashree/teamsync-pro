import "./globals.css";
import { THEME_INIT_SCRIPT } from "../lib/theme";

export const metadata = {
  title: "TeamSync — real-time task boards",
  description: "A real-time collaborative kanban board built with Next.js, Express and Socket.io"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Sets the dark/light class before paint so there's no flash of the wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
