
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Settings, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import LifeOSLogo from './LifeOSLogo';
import { chatWithAI, type ChatInput, type ChatOutput } from '@/ai/flows/chat-flow-new';
import { getAuth, type User } from 'firebase/auth'; // To check for current user
import { app } from '@/lib/firebase/client'; // Firebase app instance

const auth = getAuth(app);

const AiConsole = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{id: string, sender: string, text: string}[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // This currentUser state is for UI purposes or general checks, but for critical operations like token retrieval, we'll use auth.currentUser directly.
  const [consoleCurrentUser, setConsoleCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setConsoleCurrentUser(user);
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

      let oauthToken: string | undefined = undefined;
      const firebaseUser = auth.currentUser; // Get current user directly from Firebase auth instance at the time of send

      if (firebaseUser) {
        console.log("[AiConsole] Current Firebase User on send:", firebaseUser.uid);
        
        // Try health token first (covers most health and fitness queries)
        const storedHealthTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
        const healthToken = storedHealthTokenUserId === firebaseUser.uid ? 
          sessionStorage.getItem(`firebase_oauth_token_${firebaseUser.uid}_fit`) : null;
        
        // Try calendar token second
        const storedCalendarTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        const calendarToken = storedCalendarTokenUserId === firebaseUser.uid ? 
          sessionStorage.getItem(`firebase_oauth_token_${firebaseUser.uid}`) : null;
        
        // Use the best available token (orchestrator will intelligently choose which services to call)
        oauthToken = healthToken || calendarToken || undefined;
        console.log("[AiConsole] Token available:", !!oauthToken);
      } else {
         console.warn("[AiConsole] No Firebase user (auth.currentUser is null) at time of send. Cannot retrieve OAuth token.");
      }
      
      if (!oauthToken) {
          console.warn("[AiConsole] Proceeding to call chatWithAI without an OAuth token for the AI flow.");
      } else {
          console.log("[AiConsole] Passing OAuth token to chatWithAI flow.");
      }

      try {
        const aiThinkingMessage = { id: Date.now().toString() + '-ai-thinking', sender: 'ai', text: 'Thinking...' };
        setMessages(prev => [...prev, aiThinkingMessage]);
        
        const chatInput: ChatInput = { prompt: userMessageText, oauthToken }; // oauthToken might be undefined here
        const aiResponse = await chatWithAI(chatInput);
        
        setMessages(prev => prev.filter(msg => msg.id !== aiThinkingMessage.id));
        setMessages(prev => [...prev, { id: Date.now().toString() + '-ai', sender: 'ai', text: aiResponse.response }]);

      } catch (error) {
        console.error("Error calling AI chat flow:", error);
        setMessages(prev => prev.filter(msg => msg.text === 'Thinking...')); 
        setMessages(prev => [...prev, {id: Date.now().toString() + '-ai-error', sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
      } finally {
        setIsAiResponding(false);
      }
    }
  };

  return (
    <aside className="w-1/4 max-w-sm min-w-[320px] glassmorphic border-r-2 quantum-border p-6 space-y-6 shadow-2xl neural-grid relative overflow-hidden">
      {/* HUD Corner Elements */}
      <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-cyan-400/70" />
      <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-purple-400/70" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-pink-400/70" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-yellow-400/70" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-400/30 hud-element rounded-lg p-3">
        <div className="flex items-center gap-3">
          <LifeOSLogo />
          <div className="flex flex-col">
            <span className="font-orbitron font-bold text-sm neon-text uppercase">AI Console</span>
            <span className="text-xs text-cyan-400/80 font-mono">Neural Link Active</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="btn-holographic text-cyan-400 hover:text-white">
          <Settings size={18} />
        </Button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-2 scan-lines relative z-10" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="glassmorphic rounded-2xl p-6 border quantum-border hover:glow-cyan">
              <Bot size={48} className="mb-4 text-cyan-400 neon-glow-intense mx-auto" />
              <p className="text-lg font-orbitron font-bold neon-text mb-2">AI Core Online</p>
              <p className="text-sm text-cyan-400/80 font-mono">Neural Interface Ready</p>
              <p className="text-xs text-gray-400 mt-2">Initialize with voice command or text input</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`p-4 rounded-xl max-w-[85%] text-sm leading-relaxed relative overflow-hidden
              ${msg.sender === 'user' 
                ? 'glassmorphic border border-purple-400/30 hover:glow-purple' 
                : 'glassmorphic border border-cyan-400/30 hover:glow-cyan data-stream'
              }`}>
              {msg.sender === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} className="text-cyan-400 neon-glow-intense" />
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">JARVIS</span>
                </div>
              )}
              {msg.sender === 'user' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-purple-400/80 border border-purple-300" />
                  <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">USER</span>
                </div>
              )}
              {msg.sender === 'ai' && msg.text === 'Thinking...' && (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="text-cyan-400 animate-spin" />
                  <span className="typing font-mono text-cyan-400">Processing neural patterns...</span>
                </div>
              )}
              <div className={`${msg.sender === 'ai' ? 'text-cyan-100' : 'text-purple-100'} relative z-10`}>
                {msg.text !== 'Thinking...' && msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="mt-auto pt-6 border-t border-cyan-400/30 relative z-10">
        <div className="flex items-end space-x-3">
          <div className="flex-grow relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAiResponding ? "Neural processing active..." : "Interface with JARVIS..."}
              className="glassmorphic border-2 quantum-border focus:glow-cyan text-sm min-h-[80px] resize-none font-mono text-cyan-100 placeholder:text-cyan-400/60 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isAiResponding}
            />
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-green-400">READY</span>
            </div>
          </div>
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="glassmorphic border-2 quantum-border hover:glow-cyan h-[80px] w-[80px] rounded-xl transition-all disabled:opacity-50 btn-holographic"
            disabled={isAiResponding}
          >
            {isAiResponding ? (
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            ) : (
              <Send size={24} className="text-cyan-400" />
            )}
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="text-xs font-mono text-cyan-400/60 mb-2 uppercase tracking-wider">Neural Shortcuts:</div>
          <button className="px-3 py-1 text-xs font-mono bg-cyan-400/10 border border-cyan-400/30 rounded-full hover:bg-cyan-400/20 text-cyan-400 transition-colors">
            Focus Session
          </button>
          <button className="px-3 py-1 text-xs font-mono bg-purple-400/10 border border-purple-400/30 rounded-full hover:bg-purple-400/20 text-purple-400 transition-colors">
            Replan Day
          </button>
          <button className="px-3 py-1 text-xs font-mono bg-pink-400/10 border border-pink-400/30 rounded-full hover:bg-pink-400/20 text-pink-400 transition-colors">
            Health Scan
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AiConsole;
