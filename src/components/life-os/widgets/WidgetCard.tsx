import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, icon, children, className, contentClassName }) => {
  return (
    <Card 
      className={`
        flex flex-col glassmorphic rounded-xl overflow-hidden 
        shadow-2xl shadow-[hsla(var(--primary-rgb),0.03)] hover:shadow-[hsla(var(--primary-rgb),0.07)]
        border border-[hsla(var(--primary-rgb),0.2)] hover:border-[hsla(var(--primary-rgb),0.4)] 
        transition-all duration-300 ease-out relative
        group 
        ${className}
      `}
    >
      {/* Neon glow effect for top border - subtle */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary opacity-0 group-hover:opacity-50 transition-opacity duration-300 glowing-accent" 
           style={{filter: 'blur(2px)'}}></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 border-b border-[hsla(var(--primary-rgb),0.1)] bg-[hsla(var(--card-rgb),0.1)]"> {/* Slightly different bg for header */}
        <div className="flex items-center gap-2">
          {icon && React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 text-primary opacity-90" })}
          <CardTitle className="text-lg font-medium font-headline text-foreground/90 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent className={`flex-grow p-4 ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  );
};

export default WidgetCard;
