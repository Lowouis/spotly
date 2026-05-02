import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import {cn} from "@/lib/utils";

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef(({className, align = "center", sideOffset = 4, ...props}, ref) => (
    <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn("z-50 w-64 rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-md outline-none", className)}
            {...props}
        />
    </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export {HoverCard, HoverCardTrigger, HoverCardContent};
