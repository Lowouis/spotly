import * as React from "react";

import {cn} from "@/lib/utils";

const Switch = React.forwardRef(({className, checked = false, onCheckedChange, disabled = false, ...props}, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
            checked && "bg-primary",
            className
        )}
        data-state={checked ? "checked" : "unchecked"}
        {...props}
    >
        <span
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0",
                checked ? "translate-x-5" : "translate-x-0"
            )}
        />
    </button>
));
Switch.displayName = "Switch";

export {Switch};
