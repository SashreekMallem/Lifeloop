'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, type User } from 'firebase/auth';
import { app } from '@/lib/firebase/client';
import { FirebaseApp } from 'firebase/app';
import Link from 'next/link';
import './luxe.css';

// Widget Components
import WeatherWidget from "@/components/life-os/widgets/WeatherWidget";
import CalendarWidget from "@/components/life-os/widgets/CalendarWidget";
import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget";
import MoodWidget from "@/components/life-os/widgets/MoodWidget";
import TasksWidget from "@/components/life-os/widgets/TasksWidget";
import MorningSummaryWidget from "@/components/life-os/widgets/MorningSummaryWidget";
import PersonalizedInsightsWidget from "@/components/life-os/widgets/PersonalizedInsightsWidget";
import IntelligentSuggestionsWidget from "@/components/life-os/widgets/IntelligentSuggestionsWidget";

// Icons
import { 
  Bot, Send, Cloud, Calendar, Heart, Activity, Target, Brain, Sparkles, 
  Compass, LineChart, BookOpen, Menu, X, MoreVertical, Star, ChevronRight, Shuffle
} from 'lucide-react';

// AI Chat functionality
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { chatWithAI, type ChatInput, type ChatOutput } from '@/ai/flows/chat-flow-new';

const auth = getAuth(app);

export default function LuxeLifeInterface() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // AI Chat State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{id: string, sender: string, text: string}[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Content-aware adaptive widget sizing based on actual content dimensions
  const [adaptiveWidgetSizes, setAdaptiveWidgetSizes] = useState<{[key: string]: {gridColumn: number, gridRow: number}}>({});
  const widgetRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Measure widget content and automatically assign grid spans
  const measureAndAssignSizes = useCallback(() => {
    const measurements: {[key: string]: {gridColumn: number, gridRow: number}} = {};
    
    Object.keys(widgetRefs.current).forEach(widgetKey => {
      const element = widgetRefs.current[widgetKey];
      if (!element) return;

      // Get the actual content dimensions
      const content = element.querySelector('.widget-content') || element;
      const scrollHeight = content.scrollHeight;
      const scrollWidth = content.scrollWidth;
      
      // Calculate needed grid spans based on content
      // Column spans: based on content width and complexity
      let columnSpan = 2; // Default
      if (scrollWidth > 400 || widgetKey === 'calendar' || widgetKey === 'insights') {
        columnSpan = 4; // Wide content
      } else if (scrollWidth > 300 || widgetKey === 'health' || widgetKey === 'tasks') {
        columnSpan = 3; // Medium content
      } else if (widgetKey === 'mood' && scrollHeight < 200) {
        columnSpan = 2; // Compact content
      }
      
      // Row spans: based on content height
      let rowSpan = Math.ceil(scrollHeight / 80); // 80px per grid row
      rowSpan = Math.max(2, Math.min(6, rowSpan)); // Clamp between 2-6 rows
      
      // Special cases for specific widgets
      if (widgetKey === 'weather' && scrollHeight < 250) {
        rowSpan = 3; // Ensure weather content is fully visible
      }
      if (widgetKey === 'mood' && scrollHeight < 200) {
        rowSpan = 2; // Compact mood display
      }
      if (widgetKey === 'health') {
        rowSpan = Math.max(4, rowSpan); // Health needs minimum space for metrics
      }
      
      measurements[widgetKey] = {
        gridColumn: columnSpan,
        gridRow: rowSpan
      };
    });
    
    setAdaptiveWidgetSizes(measurements);
  }, []);

  // Auto-resize when content changes or window resizes
  useEffect(() => {
    const timer = setTimeout(measureAndAssignSizes, 100);
    const resizeObserver = new ResizeObserver(measureAndAssignSizes);
    
    Object.values(widgetRefs.current).forEach(element => {
      if (element) resizeObserver.observe(element);
    });
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [measureAndAssignSizes]);

  // Ref assignment helper
  const getWidgetRef = (widgetKey: string) => (ref: HTMLDivElement | null) => {
    widgetRefs.current[widgetKey] = ref;
    if (ref) {
      // Trigger measurement after content loads
      setTimeout(measureAndAssignSizes, 200);
    }
  };

  // Get adaptive size for a widget
  const getAdaptiveStyle = (widgetKey: string): React.CSSProperties => {
    const size = adaptiveWidgetSizes[widgetKey];
    if (!size) return {};
    
    return {
      gridColumn: `span ${size.gridColumn}`,
      gridRow: `span ${size.gridRow}`,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        // Add welcome message when user logs in
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: `Welcome back, ${user.displayName || 'friend'}. I can help you manage your calendar events and check your health data. How can I assist you today?`
        }]);
      }
    });

    window.addEventListener('mousemove', handleMouseMove);
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      unsubscribe();
    };
  }, [menuOpen]);

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

            // Get the best available OAuth token for the user
      let oauthToken: string | undefined = undefined;
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        console.log("[handleSend] Getting tokens for user:", firebaseUser.uid);
        
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
        console.log("[handleSend] Token available:", !!oauthToken);
      }

      try {
        const chatInput: ChatInput = { prompt: userMessageText, oauthToken };
        const response: ChatOutput = await chatWithAI(chatInput);
        const aiMessage = { id: Date.now().toString() + '-ai', sender: 'ai', text: response.response };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('[handleSend] Error calling AI:', error);
        let errorText = 'I apologize, but I encountered an unexpected error. Please try again.';
        
        // Handle specific error types
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('429') || errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
            errorText = 'I\'m currently experiencing high demand. Please wait a moment and try again.';
          } else if (errorMsg.includes('quota') || errorMsg.includes('exceeded')) {
            errorText = 'API quota exceeded. Please try again later.';
          } else if (errorMsg.includes('authentication') || errorMsg.includes('token')) {
            errorText = 'There was an authentication issue. Please reconnect your accounts in the widgets on the dashboard.';
          }
        }
        
        const errorMessage = { id: Date.now().toString() + '-error', sender: 'ai', text: errorText };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiResponding(false);
      }
    }
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass size={20} /> },
    { id: 'insights', label: 'Insights', icon: <LineChart size={20} /> },
    { id: 'assistant', label: 'Assistant', icon: <Bot size={20} /> },
  ];

  // Format date for header
  const formatDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  if (!currentUser) {
    return (
      <div className="luxe-canvas" ref={containerRef}>
        {/* Ambient Background Elements - Made subtle for better readability */}
        <div className="luxe-ambient-glow">
          <div 
            className="ambient-light ambient-light-primary"
            style={{
              left: `${mousePosition.x * 30}%`,
              top: `${mousePosition.y * 30}%`,
              opacity: 0.04
            }}
          />
          <div 
            className="ambient-light ambient-light-accent"
            style={{
              right: `${(1 - mousePosition.x) * 30}%`,
              top: `${mousePosition.y * 70}%`,
              opacity: 0.03
            }}
          />
          <div className="ambient-glitter" />
        </div>
        
        <div className="luxe-auth-container">
          <div className="luxe-logo">
            <span className="logo-letter">L</span>
            <span className="logo-text">LIFELOOP</span>
          </div>
          
          <h1 className="luxe-heading">Elevate Your Life Experience</h1>
          <p className="luxe-subheading">
            Where intelligent design meets personalized assistance in perfect harmony
          </p>
          
          <Link href="/auth" className="luxe-btn luxe-btn-primary">
            Begin Your Journey
            <ChevronRight size={18} />
          </Link>

          <div className="luxe-auth-features">
            <div className="auth-feature">
              <div className="feature-icon">
                <Brain size={24} />
              </div>
              <div className="feature-text">
                <h3>AI Assistance</h3>
                <p>Your personal intelligent companion</p>
              </div>
            </div>
            
            <div className="auth-feature">
              <div className="feature-icon">
                <LineChart size={24} />
              </div>
              <div className="feature-text">
                <h3>Insightful Analytics</h3>
                <p>Understand patterns in your life</p>
              </div>
            </div>
            
            <div className="auth-feature">
              <div className="feature-icon">
                <Star size={24} />
              </div>
              <div className="feature-text">
                <h3>Premium Experience</h3>
                <p>Elegantly designed interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxe-canvas" ref={containerRef}>
      {/* Ambient Background Elements - Made subtle for better readability */}
      <div className="luxe-ambient-glow">
        <div 
          className="ambient-light ambient-light-primary"
          style={{
            left: `${mousePosition.x * 30}%`,
            top: `${mousePosition.y * 30}%`,
            opacity: 0.04
          }}
        />
        <div 
          className="ambient-light ambient-light-accent"
          style={{
            right: `${(1 - mousePosition.x) * 30}%`,
            top: `${mousePosition.y * 70}%`,
            opacity: 0.03
          }}
        />
        <div 
          className="ambient-light ambient-light-tertiary"
          style={{
            left: `${mousePosition.x * 70}%`,
            bottom: `${(1 - mousePosition.y) * 30}%`,
            opacity: 0.03
          }}
        />
        <div className="ambient-glitter" />
      </div>
      
      {/* Navigation */}
      <div className="luxe-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
          >
            {section.icon}
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
        
        <button className="nav-menu-toggle" onClick={() => setMenuOpen(true)}>
          <Menu size={20} />
        </button>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="luxe-mobile-menu">
          <button className="menu-close" onClick={() => setMenuOpen(false)}>
            <X size={24} />
          </button>
          
          <div className="menu-user">
            <div className="user-avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="user-info">
              <h4>{currentUser?.displayName || 'User'}</h4>
              <p>{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="menu-sections">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setMenuOpen(false);
                }}
                className={`menu-item ${activeSection === section.id ? 'active' : ''}`}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </div>
          
          <div className="menu-footer">
            <Link href="/settings" className="menu-link">
              Settings
            </Link>
            <button 
              className="menu-link"
              onClick={() => auth.signOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="luxe-content">
        {/* Header Section */}
        <header className="luxe-header">
          <div className="header-welcome">
            <h1>Welcome, {currentUser?.displayName?.split(' ')[0] || 'User'}</h1>
            <p>{formatDate()}</p>
          </div>
          <div className="header-user">
            <div className="user-status">
              <div className="status-indicator status-active">
                <div className="status-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
            <div className="user-avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
          </div>
        </header>
        
        {/* Dashboard Section - Full-screen widgets with floating AI assistant */}
        {activeSection === 'dashboard' && (
          <section className="luxe-section fullscreen-dashboard">
            {/* Dashboard Controls */}
            <div className="dashboard-controls">
              <button 
                onClick={measureAndAssignSizes}
                className="randomize-btn"
                title="Optimize Widget Layout"
              >
                <Shuffle size={18} />
                <span>Auto-size Widgets</span>
              </button>
            </div>

            {/* Full-screen Widget Grid */}
            <div className="fullscreen-widgets-grid">
              {/* Weather Widget */}
              <div 
                ref={getWidgetRef('weather')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('weather')}
              >
                <div className="widget-header">
                  <Cloud size={20} />
                  <span>Weather</span>
                </div>
                <div className="widget-content">
                  <WeatherWidget defaultLocation="London, UK" />
                </div>
              </div>
              
              {/* Calendar Widget */}
              <div 
                ref={getWidgetRef('calendar')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('calendar')}
              >
                <div className="widget-header">
                  <Calendar size={20} />
                  <span>Calendar</span>
                </div>
                <div className="widget-content">
                  <CalendarWidget />
                </div>
              </div>
              
              {/* Health Data Widget */}
              <div 
                ref={getWidgetRef('health')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('health')}
              >
                <div className="widget-header">
                  <Activity size={20} />
                  <span>Health</span>
                </div>
                <div className="widget-content">
                  <HealthDataWidget />
                </div>
              </div>
              
              {/* Tasks Widget */}
              <div 
                ref={getWidgetRef('tasks')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('tasks')}
              >
                <div className="widget-header">
                  <Target size={20} />
                  <span>Tasks</span>
                </div>
                <div className="widget-content">
                  <TasksWidget />
                </div>
              </div>
              
              {/* Mood Widget */}
              <div 
                ref={getWidgetRef('mood')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('mood')}
              >
                <div className="widget-header">
                  <Heart size={20} />
                  <span>Mood</span>
                </div>
                <div className="widget-content">
                  <MoodWidget />
                </div>
              </div>
              
              {/* Insights Widget */}
              <div 
                ref={getWidgetRef('insights')}
                className="fullscreen-widget"
                style={getAdaptiveStyle('insights')}
              >
                <div className="widget-header">
                  <Brain size={20} />
                  <span>Insights</span>
                </div>
                <div className="widget-content">
                  <PersonalizedInsightsWidget />
                </div>
              </div>
            </div>

            {/* Floating AI Assistant - Bottom Right Corner */}
            <div className="floating-ai-assistant">
              <div className="ai-assistant-floating">
                <div className="assistant-header-floating">
                  <div className="assistant-icon">
                    <Bot size={20} />
                  </div>
                  <span>AI Assistant</span>
                </div>
                
                <div className="assistant-content-floating">
                  {messages.length > 0 ? (
                    <div className="chat-messages-floating">
                      {messages.slice(-10).map((message) => (
                        <div 
                          key={message.id} 
                          className={`chat-message-floating ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                        >
                          <div className="message-content-floating">
                            {message.text.length > 200 ? message.text.substring(0, 200) + '...' : message.text}
                          </div>
                        </div>
                      ))}
                      
                      {isAiResponding && (
                        <div className="chat-message-floating ai-message">
                          <div className="message-content-floating thinking">
                            <span className="thinking-dot"></span>
                            <span className="thinking-dot"></span>
                            <span className="thinking-dot"></span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="assistant-welcome-floating">
                      <p>How can I help you today?</p>
                    </div>
                  )}
                  
                  <div className="assistant-input-floating">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="assistant-textarea-floating"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={isAiResponding || !input.trim()}
                      className="assistant-send-btn-floating"
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Insights Section - Simplified to focus on analytics */}
        {activeSection === 'insights' && (
          <section className="luxe-section">
            <h2 className="section-title">Analytics & Insights</h2>
            
            <div className="insights-layout">
              <div className="insight-card feature-card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Sparkles size={20} />
                    </div>
                    <span>Morning Summary</span>
                  </div>
                </div>
                <div className="card-content">
                  <MorningSummaryWidget />
                </div>
              </div>
              
              <div className="insight-card feature-card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Brain size={20} />
                    </div>
                    <span>Personalized Insights</span>
                  </div>
                </div>
                <div className="card-content">
                  <PersonalizedInsightsWidget />
                </div>
              </div>
              
              <div className="insight-card feature-card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Sparkles size={20} />
                    </div>
                    <span>Smart Suggestions</span>
                  </div>
                </div>
                <div className="card-content">
                  <IntelligentSuggestionsWidget />
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Assistant Section */}
        {activeSection === 'assistant' && (
          <section className="luxe-section assistant-section">
            <h2 className="section-title">Your Personal Assistant</h2>
            
            <div className="luxe-chat-container">
              <div className="chat-messages">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`chat-message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    <div className="message-avatar">
                      {message.sender === 'user' ? (
                        currentUser?.photoURL ? (
                          <img src={currentUser.photoURL} alt="User" />
                        ) : (
                          <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>
                        )
                      ) : (
                        <Bot size={20} />
                      )}
                    </div>
                    <div className="message-content">
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                
                {isAiResponding && (
                  <div className="chat-message ai-message">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="message-content thinking">
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                    </div>
                  </div>
                )}
              </div>
              
              {messages.length === 0 && !isAiResponding && (
                <div className="chat-welcome">
                  <div className="welcome-icon">
                    <Bot size={48} />
                  </div>
                  <h3>How can I assist you today?</h3>
                  <div className="welcome-suggestions">
                    <button 
                      className="suggestion-btn"
                      onClick={() => {
                        setInput("What's on my calendar today?");
                        setTimeout(() => handleSend(), 100);
                      }}
                    >
                      What's on my calendar today?
                    </button>
                    <button 
                      className="suggestion-btn"
                      onClick={() => {
                        setInput("Schedule a meeting tomorrow at 10am");
                        setTimeout(() => handleSend(), 100);
                      }}
                    >
                      Schedule a meeting tomorrow at 10am
                    </button>
                    <button 
                      className="suggestion-btn"
                      onClick={() => {
                        setInput("How many steps did I take today?");
                        setTimeout(() => handleSend(), 100);
                      }}
                    >
                      How many steps did I take today?
                    </button>
                    <button 
                      className="suggestion-btn"
                      onClick={() => {
                        setInput("How did I sleep last night?");
                        setTimeout(() => handleSend(), 100);
                      }}
                    >
                      How did I sleep last night?
                    </button>
                  </div>
                </div>
              )}
              
              <div className="chat-input">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="input-field"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isAiResponding || !input.trim()}
                  className="send-btn"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}