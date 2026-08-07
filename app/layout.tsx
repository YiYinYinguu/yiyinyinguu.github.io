import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yiyinyinguu.github.io"),
  title: "Lu Ying - Personal Homepage",
  description:
    "Lu Ying (应璐) — Postdoctoral Fellow at the National University of Singapore. Research on data visualization, human-computer interaction, and data-driven storytelling.",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Lu Ying - Personal Homepage",
    description:
      "Lu Ying (应璐) — Postdoctoral Fellow at the National University of Singapore. Research on data visualization, human-computer interaction, and data-driven storytelling.",
    url: "https://yiyinyinguu.github.io",
    siteName: "Lu Ying",
    type: "profile",
    images: ["/profile.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
