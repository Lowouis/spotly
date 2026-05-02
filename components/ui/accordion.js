'use client';

import React from 'react';
import {cn} from '@/lib/utils';

const Accordion = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
));
Accordion.displayName = 'Accordion';

const AccordionItem = React.forwardRef(({className, ...props}, ref) => (
    <details ref={ref} className={cn('group rounded-lg border border-neutral-200 dark:border-neutral-700', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef(({className, children, ...props}, ref) => (
    <summary
        ref={ref}
        className={cn('flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-neutral-700 outline-none transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50 [&::-webkit-details-marker]:hidden', className)}
        {...props}
    >
        {children}
        <span className="text-neutral-400 transition-transform group-open:rotate-180">⌄</span>
    </summary>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn('border-t border-neutral-200 p-4 dark:border-neutral-700', className)} {...props} />
));
AccordionContent.displayName = 'AccordionContent';

export {Accordion, AccordionContent, AccordionItem, AccordionTrigger};
