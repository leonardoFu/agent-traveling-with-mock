import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Travel Planner (Mock)",
  description: "Scaffold for a deterministic travel-planning agent with mock tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
