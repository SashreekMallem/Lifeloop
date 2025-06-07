import type React from 'react';

const LifeOSLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* More futuristic/abstract logo */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5" // Thinner lines
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary opacity-90 group-hover:opacity-100 transition-opacity"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary-rgb))" />
            <stop offset="100%" stopColor="hsl(var(--secondary-rgb))" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="url(#logoGradient)" opacity="0.5"></circle>
        <circle cx="12" cy="12" r="6" fill="hsl(var(--primary-rgb))" stroke="none" opacity="0.7">
           <animate attributeName="r" values="6;7;6" dur="3s" repeatCount="indefinite" />
        </circle>
        <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke="hsl(var(--primary-rgb))" opacity="0.3"></path>
      </svg>
      <span className="font-headline text-2xl font-bold text-primary neon-text-primary tracking-tighter">LifeOS</span>
    </div>
  );
};

export default LifeOSLogo;
