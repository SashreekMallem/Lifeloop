import React from 'react';

interface WidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, icon, children, className, contentClassName }) => {
  return (
    <div 
      className={`
        widget-card-wrapper h-full w-full
        ${className}
      `}
    >
      {/* Content Area - No duplicate header since parent handles it */}
      <div className={`
        widget-card-content h-full w-full flex flex-col
        ${contentClassName}
      `}>
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;
