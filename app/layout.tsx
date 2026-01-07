import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUMOS - Community Blogging Platform",
  description: "Create rooms, collaborate, and write amazing blogs with AI assistance",
  keywords: ["blog", "blogging", "community", "AI", "writing", "collaboration"],
  authors: [{ name: "LUMOS" }],
  openGraph: {
    title: "LUMOS - Community Blogging Platform",
    description: "Create rooms, collaborate, and write amazing blogs with AI assistance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
