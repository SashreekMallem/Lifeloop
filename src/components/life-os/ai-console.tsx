
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Settings, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import LifeOSLogo from './LifeOSLogo';
import { chatWithAI, type ChatInput, type ChatOutput } from '@/ai/flows/chat-flow';
import { getAuth, type User } from 'firebase/auth'; // To check for current user
import { app } from '@/lib/firebase/client'; // Firebase app instance

const auth = getAuth(app);

const AiConsole = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{id: string, sender: string, text: string}[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() && !isAiResponding) {
      const userMessageText = input;
      const userMessage = { id: Date.now().toString() + '-user', sender: 'user', text: userMessageText };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsAiResponding(true);

      // Retrieve OAuth token if user is signed in and token exists in session storage
      // This token is primarily for Google Calendar API interactions via AI
      let oauthToken: string | undefined = undefined;
      if (currentUser) {
        const storedTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        if (storedTokenUserId === currentUser.uid) {
          oauthToken = sessionStorage.getItem(`firebase_oauth_token_${currentUser.uid}`) || undefined;
        }
      }
      if (oauthToken) {
        console.log("[AiConsole] Found OAuth token for current user, will pass to chat flow.");
      } else {
         console.log("[AiConsole] No OAuth token found for current user. Calendar actions might require re-auth.");
      }

      try {
        const aiThinkingMessage = { id: Date.now().toString() + '-ai-thinking', sender: 'ai', text: 'Thinking...' };
        setMessages(prev => [...prev, aiThinkingMessage]);
        
        const chatInput: ChatInput = { prompt: userMessageText, oauthToken };
        const aiResponse = await chatWithAI(chatInput);
        
        setMessages(prev => prev.filter(msg => msg.id !== aiThinkingMessage.id));
        setMessages(prev => [...prev, { id: Date.now().toString() + '-ai', sender: 'ai', text: aiResponse.response }]);

      } catch (error) {
        console.error("Error calling AI chat flow:", error);
        setMessages(prev => prev.filter(msg => msg.id !== aiThinkingMessage.id)); 
        setMessages(prev => [...prev, {id: Date.now().toString() + '-ai-error', sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
      } finally {
        setIsAiResponding(false);
      }
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
            <p className="text-xs">Awaiting your command. Try asking to schedule an event!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-[85%] text-sm leading-relaxed
              ${msg.sender === 'user' 
                ? 'bg-primary/20 text-foreground shadow-md'
                : 'bg-card/80 backdrop-blur-sm border border-primary/10 text-foreground shadow-lg'
              } 
              ${msg.sender === 'ai' && 'glassmorphic'}`}>
              {msg.sender === 'ai' && msg.text === 'Thinking...' && <Loader2 size={16} className="inline mr-2 mb-0.5 text-primary animate-spin" />}
              {msg.sender === 'ai' && msg.text !== 'Thinking...' && <Bot size={16} className="inline mr-2 mb-0.5 text-primary" />}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="mt-auto pt-4 border-t border-[hsla(var(--primary-rgb),0.05)]">
        <div className="flex items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAiResponding ? "AI is responding..." : "Ask Gemini..."}
            className="flex-grow bg-background/50 border-primary/20 focus:border-primary focus:ring-primary text-sm min-h-[60px] resize-none glassmorphic"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isAiResponding}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="bg-primary hover:bg-primary/80 text-primary-foreground h-[60px] w-[60px] rounded-xl shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50"
            disabled={isAiResponding}
          >
            {isAiResponding ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Quick Actions: [Focus Session] [Replan Day]
        </div>
      </div>
    </aside>
  );
};

export default AiConsole;
