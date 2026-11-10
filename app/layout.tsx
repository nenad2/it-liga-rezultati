import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Liga Niš | Built in tech. United by football.",
  description: "Fixtures, results, standings, teams and top scorers for the IT Liga Niš 2026/27 football season.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.png", type: "image/png", sizes: "256x256" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
