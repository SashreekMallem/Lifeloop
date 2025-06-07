import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['PT Sans', 'sans-serif'],
        headline: ['Poppins', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))', // Uses CSS var
        foreground: 'hsl(var(--foreground))', // Uses CSS var
        card: {
          DEFAULT: 'hsl(var(--card))', // Uses CSS var for base, opacity applied in components or globals.css
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))', // Neon Cyan
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))', // Electric Indigo
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', // Neon Cyan (can be different if needed)
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))', // Neon Cyan border (opacity managed in globals or components)
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))', // Neon Cyan
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },
        'ai-orb': {
          background: 'hsl(var(--ai-orb-bg-rgb))',
          glow: 'hsl(var(--ai-orb-glow-rgb))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)', 
        md: 'calc(var(--radius) - 0.125rem)',
        sm: 'calc(var(--radius) - 0.25rem)',
        xl: 'calc(var(--radius) + 0.25rem)', // New larger radius
        '2xl': 'calc(var(--radius) + 0.5rem)', // New even larger radius
      },
      boxShadow: {
        'neon-primary': '0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary)), 0 0 15px hsl(var(--primary)), 0 0 20px hsl(var(--primary))',
        'neon-secondary': '0 0 5px hsl(var(--secondary)), 0 0 10px hsl(var(--secondary)), 0 0 15px hsl(var(--secondary))',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)', // For glassmorphism card elevation
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-glow': { // For AI orb or active elements
          '0%, 100%': { opacity: '0.7', boxShadow: '0 0 10px hsl(var(--primary-rgb)), 0 0 20px hsl(var(--primary-rgb))' },
          '50%': { opacity: '1', boxShadow: '0 0 20px hsl(var(--primary-rgb)), 0 0 40px hsl(var(--primary-rgb))' },
        },
        'spin-slow': {
           to: { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      backdropBlur: { // Enable backdrop blur utilities if not default
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    function ({ addUtilities }: { addUtilities: any}) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-primary': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'hsl(var(--primary))',
            borderRadius: 'var(--radius)',
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'hsla(var(--primary-rgb), 0.8)',
          },
        },
         '.scrollbar-thumb-primary\\/30::--webkit-scrollbar-thumb': { // Specific for Webkit
            backgroundColor: 'hsla(var(--primary-rgb), 0.3) !important',
        },
        '.scrollbar-track-transparent': {
           '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
} satisfies Config;
