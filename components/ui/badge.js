import * as React from "react";
import {cva} from "class-variance-authority";

import {cn} from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground",
                secondary: "border-transparent bg-secondary text-secondary-foreground",
                destructive: "border-transparent bg-destructive text-destructive-foreground",
                outline: "text-foreground",
                success: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                danger: "border-transparent bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
                neutral: "border-transparent bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({className, variant, ...props}) {
    return <div className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};
