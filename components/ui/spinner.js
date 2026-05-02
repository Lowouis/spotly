import {Loader2} from "lucide-react";

import {cn} from "@/lib/utils";

export function Spinner({className, label}) {
    return (
        <div className="inline-flex items-center gap-2" role="status" aria-live="polite">
            <Loader2 className={cn("h-5 w-5 animate-spin", className)} aria-hidden="true" />
            {label && <span className="text-sm text-muted-foreground">{label}</span>}
        </div>
    );
}
