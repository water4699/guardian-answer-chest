import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ExamVault - Guardian Answer Chest",
  description: "Privacy-preserving exam answer submission system using FHE",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="bg-primary text-primary-foreground py-6 mt-auto">
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm">
                  © 2025 ExamVault. Securing academic integrity through blockchain technology.
                </p>
              </div>
            </footer>
          </div>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
