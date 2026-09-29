import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Performance by The Colour Works",
  description: "A TCW learning platform for workshop activities and My Discovery Learning Experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
