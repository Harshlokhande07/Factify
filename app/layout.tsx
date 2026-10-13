import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreHydrator } from "@/components/store-hydrator";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Factify — Misinformation Origin & Evidence Tracing Assistant",
  description:
    "Organize, decompose, and trace evidence relationships, provenance chains, and wording shifts across available records.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="ambient-gradient-bg min-h-screen bg-[#faf8f5] text-slate-900 transition-colors dark:bg-[#0b0f17] dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <StoreHydrator>
            {children}
            <Toaster position="top-right" richColors />
          </StoreHydrator>
        </ThemeProvider>
      </body>
    </html>
  );
}
