import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AiConsole from '@/components/life-os/ai-console';
import LifeStream from '@/components/life-os/lifestream';
import AiAssistantOrb from '@/components/life-os/ai-assistant-orb';

export const metadata: Metadata = {
  title: 'Life OS - Command Center',
  description: 'Your personalized operating system for life, J.A.R.V.I.S. style.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Expanded Poppins weights */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gradient-to-br from-[hsl(var(--background-start-rgb))] to-[hsl(var(--background-end-rgb))] text-foreground">
        <div className="flex min-h-screen w-full">
          <AiConsole />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
          <LifeStream />
        </div>
        <AiAssistantOrb />
        <Toaster />
      </body>
    </html>
  );
}
