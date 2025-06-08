
'use client';

import React, { useState, useEffect } from 'react';
import WeatherWidget from "@/components/life-os/widgets/WeatherWidget";
import CalendarWidget from "@/components/life-os/widgets/CalendarWidget"; // Import CalendarWidget
import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget"; // Import HealthDataWidget

const bootSequenceLines = [
  { id: 1, text: "Booting AI Core..." },
  { id: 2, text: "LifeLoop OS // Online" },
  { id: 3, text: "Cognitive Engine // Online" },
  { id: 4, text: "Oracle Intel System // Engaged" },
  { id: 5, text: "Lifestream Feed // Awaiting Pulse" },
  { id: 6, text: "Welcome back, Operator." },
];

export default function LifeOSDashboard() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    bootSequenceLines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, line.id]);
          if (index === bootSequenceLines.length - 1) {
            timers.push(setTimeout(() => setShowContent(true), 1000)); // Show content after last line
          }
        }, (index + 1) * 1200) // Stagger appearance
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-10 text-center relative overflow-hidden">
      {!showContent ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-code text-lg md:text-xl lg:text-2xl space-y-3">
            {bootSequenceLines.map((line) => (
              <p
                key={line.id}
                className={`
                  transition-all duration-1000 ease-in-out
                  ${visibleLines.includes(line.id) ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-5 blur-sm'}
                  ${line.id === bootSequenceLines.length ? 'text-primary neon-text-primary font-semibold' : 'text-muted-foreground/80'}
                `}
              >
                {visibleLines.includes(line.id) && line.text.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="animate-char-fade-in"
                    style={{ animationDelay: `${charIndex * 0.03}s` }}
                  >
                    {char}
                  </span>
                ))}
                {!visibleLines.includes(line.id) && <>&nbsp;</>}
              </p>
            ))}
          </div>
        </div>
      ) : (
        // Dashboard content appears after boot sequence
        <div className="w-full max-w-6xl mx-auto animate-fade-in-slow">
          <h1 className="text-4xl font-headline font-bold text-primary neon-text-primary tracking-tight mb-8">
            System Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WeatherWidget className="md:col-span-1 lg:col-span-1 min-h-[280px]" defaultLocation="London, UK" />
            <CalendarWidget className="md:col-span-1 lg:col-span-1 min-h-[300px]" />
            <HealthDataWidget className="md:col-span-1 lg:col-span-1 min-h-[300px]" />
            
            {/* Placeholder for other widgets/modules as they are re-integrated */}
            {/* Example:
            <div className="md:col-span-1 lg:col-span-1 p-4 glassmorphic rounded-xl min-h-[280px]">
              <h3 className="text-xl font-semibold text-primary mb-2">Module Placeholder 1</h3>
              <p className="text-muted-foreground">Content will appear here.</p>
            </div>
            */}
          </div>
        </div>
      )}
    </div>
  );
}
