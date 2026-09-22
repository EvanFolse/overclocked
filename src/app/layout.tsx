import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overclocked",
  description:
    "CSC 3501 educational idle game: build a CPU, earn Compute Points from clock/CPI/cache/cores, and master CPU, Memory, Boolean Logic, and GPU course topics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("overclocked-theme")||localStorage.getItem("cpu-tycoon-theme");var d=t==="light"?"light":t==="dark"?"dark":(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(d);e.style.colorScheme=d;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
