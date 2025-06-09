import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl hover:shadow-primary-500/25",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:shadow-red-500/25",
        outline: "border border-gray-600 bg-transparent text-white hover:bg-primary-500/10 hover:border-primary-500 hover:text-primary-400",
        secondary: "bg-gradient-to-r from-dark-700 to-dark-800 text-white hover:from-dark-600 hover:to-dark-700 shadow-lg",
        accent: "bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-lg hover:shadow-xl hover:shadow-accent-500/25",
        ghost: "text-gray-300 hover:bg-dark-800 hover:text-white",
        link: "text-primary-400 underline-offset-4 hover:underline hover:text-primary-300",
        luxe: "bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-size-200 bg-pos-0 text-white hover:bg-pos-100 shadow-2xl hover:shadow-glow-primary animate-shimmer",
      },
      size: {
        default: "h-11 px-6 py-3 rounded-xl text-sm",
        sm: "h-9 px-4 py-2 rounded-lg text-sm",
        lg: "h-13 px-8 py-4 rounded-xl text-base",
        xl: "h-16 px-10 py-5 rounded-2xl text-lg",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
