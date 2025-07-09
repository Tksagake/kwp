import * as React from 'react';
import { cn } from '@/lib/utils';

// Define types for the color schemes
type CardColorScheme = 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  colorScheme?: CardColorScheme;
}

const colorSchemes = {
  default: 'bg-card text-card-foreground border-border',
  primary: 'bg-blue-500 text-white border-blue-600',
  secondary: 'bg-gray-500 text-white border-gray-600',
  success: 'bg-green-500 text-white border-green-600',
  danger: 'bg-red-500 text-white border-red-600',
  warning: 'bg-yellow-500 text-white border-yellow-600',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, colorScheme = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border shadow-sm',
        colorSchemes[colorScheme],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
