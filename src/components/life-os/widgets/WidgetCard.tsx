import React from 'react';

interface WidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
  showHeader?: boolean;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ 
  title, 
  icon, 
  children, 
  className, 
  contentClassName, 
  headerActions,
  showHeader = false 
}) => {
  return (
    <div 
      className={`
        widget-card-wrapper h-full w-full
        ${className}
      `}
    >
      {/* Optional Header */}
      {showHeader && (
        <div className="widget-card-header flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Content Area */}
      <div className={`
        widget-card-content h-full w-full flex flex-col
        ${showHeader ? 'flex-1' : ''}
        ${contentClassName}
      `}>
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;
