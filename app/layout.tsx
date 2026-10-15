import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "lenis/dist/lenis.css";
import { ScrollMotion } from "@/components/site/ScrollMotion";

export const metadata: Metadata = {
  title: "WeEvolveIT | your tech partner. evolved.",
  description: "An AI-first agency — and your end-to-end tech partner.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="geist_mono_1bf8cbf6-module__FlyLvG__variable jetbrains_mono_84d6efd-module__5Hl15a__variable h-full antialiased">
      <head>
        <link rel="stylesheet" href="/reference-assets/static/chunks/0n2~1o2-mvux1.css" />
        <link rel="stylesheet" href="/reference-assets/static/chunks/14xjhfymotqh9.css" />
      </head>
      <body className="isolate min-h-full flex flex-col overflow-x-clip bg-bg text-fg font-mono">{children}<ScrollMotion /></body>
    </html>
  );
}
