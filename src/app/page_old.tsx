
'use client';

import React, { useState, useEffect, useRef } from 'react';
import WeatherWidget from "@/components/life-os/widgets/WeatherWidget";
import CalendarWidget from "@/components/life-os/widgets/CalendarWidget";
import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget";
import MoodWidget from "@/components/life-os/widgets/MoodWidget";
import TasksWidget from "@/components/life-os/widgets/TasksWidget";
import MorningSummaryWidget from "@/components/life-os/widgets/MorningSummaryWidget";
import PersonalizedInsightsWidget from "@/components/life-os/widgets/PersonalizedInsightsWidget";
import IntelligentSuggestionsWidget from "@/components/life-os/widgets/IntelligentSuggestionsWidget";
import AIAssistantOrb from "@/components/life-os/ai-assistant-orb";
import { Bot, Send, Settings, Loader2, Zap, Bell, Award, MessageSquare, Lightbulb, Brain, Activity, Heart } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatWithAI, type ChatInput, type ChatOutput } from '@/ai/flows/chat-flow';
import { getAuth, type User } from 'firebase/auth';
import { app } from '@/lib/firebase/client';

const auth = getAuth(app);

interface StreamItem {
  id: number;
  icon: React.ReactNode;
  text: string;
  time: string;
  type: string;
}

const welcomeMessages = [
  { id: 1, text: "Good morning" },
  { id: 2, text: "Your sanctuary awaits" },
  { id: 3, text: "Welcome to LifeLoop" },
];

export default function LifeLoopDashboard() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'insights' | 'lifestream'>('overview');
  
  // AI Chat State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{id: string, sender: string, text: string}[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // LifeStream State
  const [streamItems] = useState<StreamItem[]>([
    { id: 1, icon: <Brain className="h-4 w-4 text-blue-400" />, text: "Morning routine analysis completed. Optimization suggestions ready.", time: "2 min ago", type: "insight" },
    { id: 2, icon: <Activity className="h-4 w-4 text-green-400" />, text: "Health metrics updated. All vitals within optimal range.", time: "5 min ago", type: "health" },
    { id: 3, icon: <MessageSquare className="h-4 w-4 text-purple-400" />, text: "3 new intelligent suggestions generated based on your patterns.", time: "12 min ago", type: "suggestion" },
    { id: 4, icon: <Lightbulb className="h-4 w-4 text-yellow-400" />, text: "Weekly productivity review scheduled for this evening.", time: "1 hr ago", type: "reminder" },
    { id: 5, icon: <Heart className="h-4 w-4 text-red-400" />, text: "Mood tracking indicates positive trend this week.", time: "2 hr ago", type: "wellness" }
  ]);

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

  // AI Chat Handler
  const handleSend = async () => {
    if (input.trim() && !isAiResponding) {
      const userMessageText = input;
      const userMessage = { id: Date.now().toString() + '-user', sender: 'user', text: userMessageText };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsAiResponding(true);

      let oauthToken: string | undefined = undefined;
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        const storedTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        if (storedTokenUserId === firebaseUser.uid) {
          oauthToken = sessionStorage.getItem('firebase_oauth_token') || undefined;
        }
      }

      try {
        const chatInput: ChatInput = { message: userMessageText, oauthToken };
        const response: ChatOutput = await chatWithAI(chatInput);
        const aiMessage = { id: Date.now().toString() + '-ai', sender: 'ai', text: response.response };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error calling AI:', error);
        const errorMessage = { id: Date.now().toString() + '-error', sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiResponding(false);
      }
    }
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    welcomeMessages.forEach((message, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, message.id]);
          if (index === welcomeMessages.length - 1) {
            timers.push(setTimeout(() => setShowDashboard(true), 1200));
          }
        }, (index + 1) * 600)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!showDashboard) {
    return (
      <div className="organic-bg min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="space-y-8">
            {welcomeMessages.map((message, index) => (
              <div
                key={message.id}
                className={`
                  transition-all duration-700 ease-out
                  ${visibleMessages.includes(message.id) 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'}
                  ${message.id === welcomeMessages.length 
                    ? 'text-6xl md:text-7xl warm-gradient-text font-bold' 
                    : 'text-2xl md:text-3xl text-muted-foreground'}
                `}
                style={{ 
                  animationDelay: `${index * 0.2}s`,
                  animation: visibleMessages.includes(message.id) 
                    ? 'fadeInScale 0.8s ease-out forwards' 
                    : 'none'
                }}
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="organic-bg min-h-screen">
      {/* Header Section */}
      <header className="px-6 py-12 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold warm-gradient-text mb-6 gentle-float">
              LifeLoop
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto text-balance">
              Your intelligent companion for a life well-lived
            </p>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="px-6 md:px-12 lg:px-24 pb-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Primary Widget Row */}
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="widget-container h-full">
                  <MorningSummaryWidget />
                </div>
              </div>
              <div className="widget-container">
                <WeatherWidget defaultLocation="London, UK" />
              </div>
            </div>
          </section>

          {/* Secondary Widget Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="widget-container">
                <CalendarWidget />
              </div>
              <div className="widget-container">
                <TasksWidget />
              </div>
              <div className="widget-container">
                <MoodWidget />
              </div>
              <div className="widget-container">
                <HealthDataWidget />
              </div>
            </div>
          </section>

          {/* Intelligence Center */}
          <section className="mb-12">
            <div className="widget-container">
              <div className="text-center py-12">
                <h2 className="text-4xl font-bold warm-gradient-text mb-6">
                  Intelligence Center
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary/80 flex items-center justify-center">
                      <div className="status-dot status-active scale-150" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Pattern Recognition</h3>
                    <p className="text-muted-foreground">Understanding your daily rhythms and preferences</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary to-accent/80 flex items-center justify-center">
                      <div className="status-dot status-active scale-150" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Thoughtful Insights</h3>
                    <p className="text-muted-foreground">Providing meaningful recommendations for your goals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-primary/80 flex items-center justify-center">
                      <div className="status-dot status-active scale-150" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Life Enhancement</h3>
                    <p className="text-muted-foreground">Continuously refining your daily experience</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Status Footer */}
          <footer className="text-center">
            <div className="inline-flex items-center gap-6 px-8 py-4 modern-card">
              <div className="flex items-center gap-2">
                <div className="status-dot status-active" />
                <span className="text-sm font-medium text-success">All Systems</span>
              </div>
              <div className="elegant-divider w-px h-4" />
              <div className="flex items-center gap-2">
                <div className="status-dot status-active" />
                <span className="text-sm font-medium text-primary">Intelligence Online</span>
              </div>
              <div className="elegant-divider w-px h-4" />
              <div className="flex items-center gap-2">
                <div className="status-dot status-active" />
                <span className="text-sm font-medium text-secondary">Connection Stable</span>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
