'use client';
import React from 'react';
import { Sparkles } from 'lucide-react'; // Or a more abstract "orb" icon if available

const AiAssistantOrb = () => {
  const [isThinking, setIsThinking] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  // Simulate state changes
  React.useEffect(() => {
    const thinkingTimer = setInterval(() => setIsThinking(prev => !prev), 5000);
    const speakingTimer = setInterval(() => setIsSpeaking(prev => !prev), 7000);
    return () => {
      clearInterval(thinkingTimer);
      clearInterval(speakingTimer);
    };
  }, []);

  let orbClasses = "fixed bottom-6 left-6 h-16 w-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out transform hover:scale-110 focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  let glowClasses = "absolute inset-0 rounded-full transition-all duration-500 ease-in-out";
  
  if (isSpeaking) {
    orbClasses += " bg-secondary/70 backdrop-blur-sm";
    glowClasses += " animate-pulse scale-125 opacity-50 bg-[hsl(var(--secondary-rgb))]";
  } else if (isThinking) {
    orbClasses += " bg-primary/60 backdrop-blur-sm";
    glowClasses += " animate-ping scale-110 opacity-60 bg-[hsl(var(--primary-rgb))]";
  } else {
    orbClasses += " bg-primary/80 backdrop-blur-sm"; // Idle state
    glowClasses += " opacity-30 scale-100 bg-[hsl(var(--ai-orb-glow-rgb))] animate-pulse";
  }

  return (
    <button className={orbClasses} title="AI Assistant">
      <div className={glowClasses} style={{ filter: 'blur(15px)' }}></div>
      <Sparkles className={`h-8 w-8 text-white relative z-10 transition-transform duration-300 ${isThinking ? 'animate-spin-slow' : ''}`} />
      <span className="sr-only">AI Assistant</span>
    </button>
  );
};

export default AiAssistantOrb;

// Add to tailwind.config.ts if not already present for spin-slow:
// animation: {
//   'spin-slow': 'spin 3s linear infinite',
// }
// keyframes: {
//   spin: {
//     to: { transform: 'rotate(360deg)' },
//   },
// }
