
'use client';
import React from 'react';
import { Bot, Send, Settings } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import LifeOSLogo from './LifeOSLogo';

const AiConsole = () => {
  const [input, setInput] = React.useState('');
  // Start with no mock messages
  const [messages, setMessages] = React.useState<{sender: string, text: string}[]>([]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: 'user', text: input }]);
      // Simulate AI response (to be replaced with actual Genkit flow call)
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: `Processing: "${input}"...` }]);
      }, 1000);
      setInput('');
    }
  };

  return (
    <aside className="w-1/4 max-w-sm_ min-w-[320px] bg-sidebar flex flex-col border-r border-[hsla(var(--primary-rgb),0.1)] p-4 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between pb-2 border-b border-[hsla(var(--primary-rgb),0.05)]">
        <LifeOSLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Settings size={20} />
        </Button>
      </div>
      
      <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot size={32} className="mb-2 opacity-50" />
            <p className="text-sm">AI Console Active.</p>
            <p className="text-xs">Awaiting your command.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-[80%] text-sm leading-relaxed
              ${msg.sender === 'user' 
                ? 'bg-primary/20 text-foreground shadow-md' // Adjusted user message for better contrast
                : 'bg-card/80 backdrop-blur-sm border border-primary/10 text-foreground shadow-lg'
              } 
              ${msg.sender === 'ai' && 'glassmorphic'}`}>
              {msg.sender === 'ai' && <Bot size={16} className="inline mr-2 mb-0.5 text-primary" />}
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto pt-4 border-t border-[hsla(var(--primary-rgb),0.05)]">
        <div className="flex items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini..."
            className="flex-grow bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-sm min-h-[60px] resize-none glassmorphic"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground h-[60px] w-[60px] rounded-xl shadow-lg hover:shadow-primary/50 transition-all">
            <Send size={20} />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {/* Quick Actions can be dynamically populated by AI later */}
          Quick Actions: [Focus Session] [Replan Day]
        </div>
      </div>
    </aside>
  );
};

export default AiConsole;
