'use client';

import React, { useState, useEffect, useRef } from 'react';
import './premium.css';

export default function PremiumLifeInterface() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState('focus');
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const sections = [
    { id: 'focus', label: 'Focus', icon: '◆' },
    { id: 'insights', label: 'Insights', icon: '◇' },
    { id: 'wellness', label: 'Wellness', icon: '○' },
    { id: 'creativity', label: 'Flow', icon: '△' },
  ];

  return (
    <div 
      ref={containerRef}
      className="premium-canvas"
      style={{
        '--mouse-x': mousePosition.x,
        '--mouse-y': mousePosition.y,
      } as React.CSSProperties}
    >
      {/* Dynamic Background */}
      <div className="floating-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      {/* Navigation Constellation */}
      <nav className="constellation-nav">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`constellation-point ${activeSection === section.id ? 'active' : ''}`}
            style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
          >
            <span className="point-icon">{section.icon}</span>
            <span className="point-label">{section.label}</span>
            <div className="ripple-effect" />
          </button>
        ))}
      </nav>

      {/* Main Content Flow */}
      <main className="content-flow">
        
        {/* Hero Liquid Section */}
        <section className="liquid-hero">
          <div className="hero-content">
            <h1 className="liquid-title">
              <span className="title-fragment">Life</span>
              <span className="title-fragment">Reimagined</span>
            </h1>
            <p className="hero-subtitle">
              Where intention meets intelligence in perfect harmony
            </p>
          </div>
          
          <div className="liquid-metrics">
            <div className="metric-bubble">
              <div className="metric-value">94%</div>
              <div className="metric-label">Flow State</div>
            </div>
            <div className="metric-bubble">
              <div className="metric-value">7.2k</div>
              <div className="metric-label">Life Points</div>
            </div>
            <div className="metric-bubble">
              <div className="metric-value">12</div>
              <div className="metric-label">Active Goals</div>
            </div>
          </div>
        </section>

        {/* Morphing Content Panels */}
        <section className="morphing-panels">
          
          {/* Primary Focus Panel */}
          <div className="morph-panel primary-panel">
            <div className="panel-header">
              <h2>Today's Intention</h2>
              {/* Energy Indicator */}
              <div className="energy-indicator">
                <div className="energy-wave" />
                <span>High Energy</span>
              </div>
            </div>
            
            <div className="focus-visualization">
              <div className="focus-ring">
                <div className="focus-center">
                  <span className="focus-time">2:47</span>
                  <span className="focus-label">Deep Work</span>
                </div>
                <div className="focus-segments">
                  <div className="segment completed" />
                  <div className="segment completed" />
                  <div className="segment current" />
                  <div className="segment pending" />
                </div>
              </div>
              
              <div className="micro-tasks">
                <div className="task-particle completed">Strategic Planning</div>
                <div className="task-particle active">Creative Exploration</div>
                <div className="task-particle pending">System Optimization</div>
              </div>
            </div>
          </div>

          {/* Insights Stream */}
          <div className="morph-panel insights-panel">
            <div className="panel-header">
              <h2>Neural Insights</h2>
              <div className="insight-pulse">
                <div className="pulse-dot" />
                <div className="pulse-dot" />
                <div className="pulse-dot" />
              </div>
            </div>
            
            <div className="insights-stream">
              <div className="insight-item">
                <div className="insight-icon">🧠</div>
                <div className="insight-content">
                  <p>Peak creativity detected between 2-4 PM</p>
                  <span className="confidence">97% confidence</span>
                </div>
              </div>
              
              <div className="insight-item">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <p>Exercise correlation with mood +23%</p>
                  <span className="confidence">89% confidence</span>
                </div>
              </div>
              
              <div className="insight-item">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <p>Goal momentum accelerating</p>
                  <span className="confidence">94% confidence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wellness Sphere */}
          <div className="morph-panel wellness-panel">
            <div className="panel-header">
              <h2>Holistic Balance</h2>
              <div className="balance-indicator">
                <div className="balance-dot mind" />
                <div className="balance-dot body" />
                <div className="balance-dot spirit" />
              </div>
            </div>
            
            <div className="wellness-constellation">
              <div className="wellness-node mind-node">
                <span className="node-value">85</span>
                <span className="node-label">Mental</span>
              </div>
              <div className="wellness-node body-node">
                <span className="node-value">92</span>
                <span className="node-label">Physical</span>
              </div>
              <div className="wellness-node spirit-node">
                <span className="node-value">78</span>
                <span className="node-label">Spiritual</span>
              </div>
              <div className="constellation-connections">
                <div className="connection-line line-1" />
                <div className="connection-line line-2" />
                <div className="connection-line line-3" />
              </div>
            </div>
          </div>

        </section>

        {/* Floating Action Sphere */}
        <div className="action-sphere">
          <button className="sphere-trigger">
            <div className="sphere-icon">✦</div>
            <div className="sphere-ripple" />
          </button>
          
          <div className="sphere-menu">
            <button className="sphere-action">Quick Capture</button>
            <button className="sphere-action">AI Insight</button>
            <button className="sphere-action">Flow Timer</button>
            <button className="sphere-action">Reflect</button>
          </div>
        </div>

      </main>

      {/* Ambient Status Strip */}
      <div className="status-strip">
        <div className="status-item">
          <div className="status-dot active" />
          <span>All Systems Harmonized</span>
        </div>
        <div className="status-divider" />
        <div className="status-item">
          <div className="neural-activity">
            <div className="neural-spark" />
            <div className="neural-spark" />
            <div className="neural-spark" />
          </div>
          <span>Intelligence Active</span>
        </div>
        <div className="status-divider" />
        <div className="status-item">
          <div className="connection-strength">
            <div className="signal-bar" />
            <div className="signal-bar" />
            <div className="signal-bar" />
            <div className="signal-bar" />
          </div>
          <span>Quantum Connected</span>
        </div>
      </div>

    </div>
  );
}
