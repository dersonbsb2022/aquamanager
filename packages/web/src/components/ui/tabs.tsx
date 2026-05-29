import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils.js';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'flex h-auto min-h-10 w-full max-w-full flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-6 outline-none', className)} {...props} />
);
