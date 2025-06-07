
'use client';
import React from 'react';
import { Zap, Bell, Award, MessageSquare, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StreamItem {
  id: number;
  icon: React.ReactNode;
  text: string;
  time: string;
  type: string;
}

const LifeStream = () => {
  // Start with no mock stream items
  const streamItems: StreamItem[] = [];

  return (
    <aside className="w-1/5 max-w-xs_ min-w-[280px] bg-sidebar/50 backdrop-blur-md flex flex-col border-l border-[hsla(var(--primary-rgb),0.1)] shadow-2xl">
      <div className="p-4 border-b border-[hsla(var(--primary-rgb),0.05)]">
        <h2 className="text-xl font-semibold text-primary neon-text-primary">LifeStream</h2>
        <p className="text-xs text-muted-foreground">Proactive insights & logs</p>
      </div>
      <ScrollArea className="flex-grow p-1">
        <div className="space-y-3 p-3">
        {streamItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
            <Zap size={32} className="mb-2 opacity-30" />
            <p className="text-sm">LifeStream is active.</p>
            <p className="text-xs">Awaiting system events and insights.</p>
          </div>
        )}
        {streamItems.map(item => (
          <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg glassmorphic hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex-shrink-0 mt-1 opacity-80">{item.icon}</div>
            <div className="flex-grow">
              <p className="text-sm text-foreground leading-snug">{item.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
        </div>
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-[hsla(var(--primary-rgb),0.05)] text-center">
        <p className="text-xs text-muted-foreground">LifeStream Active</p>
      </div>
    </aside>
  );
};

export default LifeStream;
