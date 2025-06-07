import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, icon, children, className }) => {
  return (
    <Card className={`flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-primary ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon && React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 text-primary" })}
          <CardTitle className="text-lg font-medium font-headline">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow">
        {children}
      </CardContent>
    </Card>
  );
};

export default WidgetCard;
