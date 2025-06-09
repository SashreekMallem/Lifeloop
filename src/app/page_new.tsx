'use client';import React, { useState, useEffect, useRef } from 'react';import { getAuth, type User } from 'firebase/auth';import { type FirebaseApp } from 'firebase/app';import { app } from '@/lib/firebase/client';import Link from 'next/link';import './luxe.css';// Widget Componentsimport WeatherWidget from "@/components/life-os/widgets/WeatherWidget";import CalendarWidget from "@/components/life-os/widgets/CalendarWidget";import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget";import MoodWidget from "@/components/life-os/widgets/MoodWidget";import TasksWidget from "@/components/life-os/widgets/TasksWidget";import MorningSummaryWidget from "@/components/life-os/widgets/MorningSummaryWidget";import PersonalizedInsightsWidget from "@/components/life-os/widgets/PersonalizedInsightsWidget";import IntelligentSuggestionsWidget from "@/components/life-os/widgets/IntelligentSuggestionsWidget";// Iconsimport {   Bot, Send, Cloud, Calendar, Heart, Activity, Target, Brain, Sparkles,  Compass, LineChart, BookOpen, Menu, X, MoreVertical, Star, ChevronRight} from 'lucide-react';// AI Chat functionalityimport { Textarea } from '@/components/ui/textarea';import { Button } from '@/components/ui/button';import { chatWithAI, type ChatInput, type ChatOutput } from '@/ai/flows/chat-flow';const auth = getAuth(app as FirebaseApp);export default function LuxeLifeInterface() {  const [activeSection, setActiveSection] = useState('dashboard');  const [currentUser, setCurrentUser] = useState<User | null>(null);  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });  const [menuOpen, setMenuOpen] = useState(false);  const containerRef = useRef<HTMLDivElement>(null);  const messagesEndRef = useRef<HTMLDivElement | null>(null);  // AI Chat State  const [input, setInput] = useState('');  const [messages, setMessages] = useState<{id: string, sender: string, text: string}[]>([]);  const [isAiResponding, setIsAiResponding] = useState(false);  useEffect(() => {    const handleMouseMove = (e: MouseEvent) => {      if (containerRef.current) {        const rect = containerRef.current.getBoundingClientRect();        setMousePosition({          x: (e.clientX - rect.left) / rect.width,          y: (e.clientY - rect.top) / rect.height,        });      }    };    const unsubscribe = auth.onAuthStateChanged(user => {      setCurrentUser(user);      if (user) {        // Add welcome message when user logs in        setMessages([{          id: 'welcome',          sender: 'ai',          text: `Welcome back, ${user.displayName || 'friend'}. How can I assist you today?`        }]);      }    });    window.addEventListener('mousemove', handleMouseMove);    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';        return () => {      window.removeEventListener('mousemove', handleMouseMove);      unsubscribe();    };  }, [menuOpen]);  const scrollToBottom = () => {    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });  };  useEffect(() => {    scrollToBottom();  }, [messages]);  // AI Chat Handler  const handleSend = async () => {    if (input.trim() && !isAiResponding) {      const userMessageText = input;      const userMessage = { id: Date.now().toString() + '-user', sender: 'user', text: userMessageText };      setMessages(prev => [...prev, userMessage]);      setInput('');      setIsAiResponding(true);      let oauthToken: string | undefined = undefined;      const firebaseUser = auth.currentUser;      if (firebaseUser) {        const storedTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');        if (storedTokenUserId === firebaseUser.uid) {          oauthToken = sessionStorage.getItem('firebase_oauth_token') || undefined;        }      }      try {        const chatInput: ChatInput = { prompt: userMessageText, oauthToken };        const response: ChatOutput = await chatWithAI(chatInput);        const aiMessage = { id: Date.now().toString() + '-ai', sender: 'ai', text: response.response };        setMessages(prev => [...prev, aiMessage]);      } catch (error) {        console.error('Error calling AI:', error);        const errorMessage = { id: Date.now().toString() + '-error', sender: 'ai', text: 'I apologize, but I encountered an unexpected error. Please try again.' };        setMessages(prev => [...prev, errorMessage]);      } finally {        setIsAiResponding(false);      }    }  };  const sections = [    { id: 'dashboard', label: 'Dashboard', icon: <Compass size={20} /> },    { id: 'insights', label: 'Insights', icon: <LineChart size={20} /> },    { id: 'wellness', label: 'Wellness', icon: <Heart size={20} /> },    { id: 'assistant', label: 'Assistant', icon: <Bot size={20} /> },  ];  // Format date for header  const formatDate = () => {    const date = new Date();    const options: Intl.DateTimeFormatOptions = {       weekday: 'long',       year: 'numeric',       month: 'long',       day: 'numeric'     };    return date.toLocaleDateString(undefined, options);  };  if (!currentUser) {    return (      <div className="luxe-canvas" ref={containerRef}>        {/* Ambient Background Elements */}        <div className="luxe-ambient-glow">          <div             className="ambient-light ambient-light-primary"            style={{              left: `${mousePosition.x * 30}%`,              top: `${mousePosition.y * 30}%`            }}          />          <div             className="ambient-light ambient-light-accent"            style={{              right: `${(1 - mousePosition.x) * 30}%`,              top: `${mousePosition.y * 70}%`            }}          />          <div className="ambient-glitter" />        </div>                <div className="luxe-auth-container">          <div className="luxe-logo">            <span className="logo-letter">L</span>            <span className="logo-text">LIFELOOP</span>          </div>                    <h1 className="luxe-heading">Elevate Your Life Experience</h1>          <p className="luxe-subheading">            Where intelligent design meets personalized assistance in perfect harmony          </p>                    <Link href="/auth" className="luxe-btn luxe-btn-primary">            Begin Your Journey            <ChevronRight size={18} />          </Link>          <div className="luxe-auth-features">            <div className="auth-feature">              <div className="feature-icon">                <Brain size={24} />              </div>              <div className="feature-text">                <h3>AI Assistance</h3>                <p>Your personal intelligent companion</p>              </div>            </div>                        <div className="auth-feature">              <div className="feature-icon">                <LineChart size={24} />              </div>              <div className="feature-text">                <h3>Insightful Analytics</h3>                <p>Understand patterns in your life</p>              </div>            </div>                        <div className="auth-feature">              <div className="feature-icon">                <Star size={24} />              </div>              <div className="feature-text">                <h3>Premium Experience</h3>                <p>Elegantly designed interface</p>              </div>            </div>          </div>        </div>      </div>    );  }  return (    <div className="luxe-canvas" ref={containerRef}>      {/* Ambient Background Elements */}      <div className="luxe-ambient-glow">        <div           className="ambient-light ambient-light-primary"          style={{            left: `${mousePosition.x * 30}%`,            top: `${mousePosition.y * 30}%`          }}        />        <div           className="ambient-light ambient-light-accent"          style={{            right: `${(1 - mousePosition.x) * 30}%`,            top: `${mousePosition.y * 70}%`          }}        />        <div           className="ambient-light ambient-light-tertiary"          style={{            left: `${mousePosition.x * 70}%`,            bottom: `${(1 - mousePosition.y) * 30}%`          }}        />        <div className="ambient-glitter" />      </div>            {/* Navigation */}      <div className="luxe-navigation">        {sections.map((section) => (          <button            key={section.id}            onClick={() => setActiveSection(section.id)}            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}          >            {section.icon}            <span className="nav-label">{section.label}</span>          </button>        ))}                <button className="nav-menu-toggle" onClick={() => setMenuOpen(true)}>          <Menu size={20} />        </button>      </div>            {/* Mobile Menu */}      {menuOpen && (        <div className="luxe-mobile-menu">          <button className="menu-close" onClick={() => setMenuOpen(false)}>            <X size={24} />          </button>                    <div className="menu-user">            <div className="user-avatar">              {currentUser?.photoURL ? (                <img src={currentUser.photoURL} alt="Profile" />              ) : (                <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>              )}            </div>            <div className="user-info">              <h4>{currentUser?.displayName || 'User'}</h4>              <p>{currentUser?.email}</p>            </div>          </div>                    <div className="menu-sections">            {sections.map((section) => (              <button                key={section.id}                onClick={() => {                  setActiveSection(section.id);                  setMenuOpen(false);                }}                className={`menu-item ${activeSection === section.id ? 'active' : ''}`}              >                {section.icon}                <span>{section.label}</span>              </button>            ))}          </div>                    <div className="menu-footer">            <Link href="/settings" className="menu-link">              Settings            </Link>            <button               className="menu-link"              onClick={() => auth.signOut()}            >              Sign Out            </button>          </div>        </div>      )}            {/* Main Content */}      <div className="luxe-content">        {/* Header Section */}        <header className="luxe-header">          <div className="header-welcome">            <h1>Welcome, {currentUser?.displayName?.split(' ')[0] || 'User'}</h1>            <p>{formatDate()}</p>          </div>          <div className="header-user">            <div className="user-status">              <div className="status-indicator status-active">                <div className="status-pulse"></div>                <span>Connected</span>              </div>            </div>            <div className="user-avatar">              {currentUser?.photoURL ? (                <img src={currentUser.photoURL} alt="Profile" />              ) : (                <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>              )}            </div>          </div>        </header>                {/* Dashboard Section */}        {activeSection === 'dashboard' && (          <section className="luxe-section">            <h2 className="section-title">Your Dashboard</h2>                        <div className="luxe-widgets-grid">              <div className="luxe-card">                <div className="card-header">                  <div className="card-title">                    <div className="card-icon">                      <Cloud size={20} />                    </div>                    <span>Weather</span>                  </div>                  <button className="card-action">                    <MoreVertical size={18} />                  </button>                </div>                <div className="card-content">                  <WeatherWidget defaultLocation="London, UK" />                </div>              </div>                            <div className="luxe-card">                <div className="card-header">                  <div className="card-title">                    <div className="card-icon">                      <Calendar size={20} />                    </div>                    <span>Calendar</span>                  </div>                  <button className="card-action">                    <MoreVertical size={18} />                  </button>                </div>                <div className="card-content">                  <CalendarWidget />                </div>              </div>                            <div className="luxe-card">                <div className="card-header">                  <div className="card-title">                    <div className="card-icon">                      <Target size={20} />                    </div>                    <span>Tasks</span>                  </div>                  <button className="card-action">                    <MoreVertical size={18} />                  </button>                </div>                <div className="card-content">                  <TasksWidget />                </div>              </div>                            <div className="luxe-card">                <div className="card-header">                  <div className="card-title">                    <div className="card-icon">                      <Heart size={20} />                    </div>                    <span>Mood</span>                  </div>                  <button className="card-action">                    <MoreVertical size={18} />                  </button>                </div>                <div className="card-content">                  <MoodWidget />                </div>              </div>            </div>          </section>        )}                {/* Insights Section */}        {activeSection === 'insights' && (          <section className="luxe-section">            <h2 className="section-title">Your Insights</h2>                        <div className="luxe-widgets-grid">              <div className="luxe-card full-width">                <div className="card-header">                  <div className="card-title">                    <div className="card-icon">                      <Sparkles size={20} />                    </div>                    <span>Morning Summary</span>                  </div>                  <button className="card-action">                    <MoreVertical size={18} />                  </button>                </div>                <div className="card-content">                  <MorningSummaryWidget />                </div>              </div>                            <div className="luxe-card full-width">                <div className="card-header">                  <div className="card-title">
                    <div className="card-icon">
                      <Brain size={20} />
                    </div>
                    <span>Personalized Insights</span>
                  </div>
                  <button className="card-action">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="card-content">
                  <PersonalizedInsightsWidget />
                </div>
              </div>
              
              <div className="luxe-card full-width">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Target size={20} />
                    </div>
                    <span>Smart Suggestions</span>
                  </div>
                  <button className="card-action">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="card-content">
                  <IntelligentSuggestionsWidget />
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Wellness Section */}
        {activeSection === 'wellness' && (
          <section className="luxe-section">
            <h2 className="section-title">Your Wellness</h2>
            
            <div className="luxe-widgets-grid">
              <div className="luxe-card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Activity size={20} />
                    </div>
                    <span>Health Data</span>
                  </div>
                  <button className="card-action">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="card-content">
                  <HealthDataWidget />
                </div>
              </div>
              
              <div className="luxe-card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-icon">
                      <Heart size={20} />
                    </div>
                    <span>Mood Tracking</span>
                  </div>
                  <button className="card-action">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="card-content">
                  <MoodWidget />
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* AI Assistant Section */}
        {activeSection === 'assistant' && (
          <section className="luxe-section">
            <h2 className="section-title">Your Personal Assistant</h2>
            
            <div className="luxe-ai-container">
              <div className="ai-messages">
                {messages.length === 0 && (
                  <div className="ai-welcome">
                    <div className="ai-welcome-icon">
                      <Bot size={48} />
                    </div>
                    <p>Hello! I'm your personal AI assistant. How can I help you today?</p>
                    <div className="ai-welcome-suggestions">
                      <button 
                        className="suggestion-chip"
                        onClick={() => setInput("What's on my calendar for today?")}
                      >
                        Calendar events
                      </button>
                      <button 
                        className="suggestion-chip"
                        onClick={() => setInput("Give me ideas for improving my well-being")}
                      >
                        Wellness tips
                      </button>
                      <button 
                        className="suggestion-chip"
                        onClick={() => setInput("Help me plan my day")}
                      >
                        Plan my day
                      </button>
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className={`ai-message ${message.sender}`}>
                    <div className="message-content">
                      {message.text}
                    </div>
                  </div>
                ))}
                
                {isAiResponding && (
                  <div className="ai-message ai">
                    <div className="message-content">
                      <div className="thinking-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <div className="ai-input-container">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your life, goals, or well-being..."
                  className="luxe-input luxe-textarea"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isAiResponding || !input.trim()}
                  className="luxe-btn luxe-btn-primary"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
      
      {/* Footer */}
      <footer className="luxe-footer">
        <div className="footer-content">
          <div className="footer-status">
            <div className="status-item">
              <div className="status-dot active"></div>
              <span>All Systems Active</span>
            </div>
            <div className="status-item">
              <div className="ai-status-indicator"></div>
              <span>AI Ready</span>
            </div>
          </div>
          <div className="footer-brand">
            <span>LIFELOOP</span>
            <span className="footer-version">v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
