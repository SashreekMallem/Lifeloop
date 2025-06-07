'use client';
import React from 'react';
import { Zap, Bell, Award, MessageSquare, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const LifeStream = () => {
  const streamItems = [
    { id: 1, icon: <Award className="text-yellow-400" />, text: "Completed 'Project Alpha Presentation' - +50 Life XP!", time: "2m ago", type: "xp" },
    { id: 2, icon: <Lightbulb className="text-secondary" />, text: "Suggestion: Try a 15-min walk to boost energy.", time: "5m ago", type: "suggestion" },
    { id: 3, icon: <Bell className="text-primary" />, text: "Reminder: Team Sync in 10 minutes.", time: "8m ago", type: "alert" },
    { id: 4, icon: <Zap className="text-green-400" />, text: "Energy levels seem optimal for focused work.", time: "15m ago", type: "insight" },
    { id: 5, icon: <MessageSquare className="text-blue-400" />, text: "Mia is nearby and free for coffee. Connect?", time: "30m ago", type: "social" },
    { id: 6, icon: <Award className="text-yellow-400" />, text: "Hit daily hydration goal - +25 Life XP!", time: "45m ago", type: "xp" },
  ];

  return (
    <aside className="w-1/5 max-w-xs_ min-w-[280px] bg-sidebar/50 backdrop-blur-md flex flex-col border-l border-[hsla(var(--primary-rgb),0.1)] shadow-2xl">
      <div className="p-4 border-b border-[hsla(var(--primary-rgb),0.05)]">
        <h2 className="text-xl font-semibold text-primary neon-text-primary">LifeStream</h2>
        <p className="text-xs text-muted-foreground">Proactive insights & logs</p>
      </div>
      <ScrollArea className="flex-grow p-1">
        <div className="space-y-3 p-3">
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
