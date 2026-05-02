import * as React from "react";

import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

const Field = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("grid gap-2", className)} {...props} />
));
Field.displayName = "Field";

const FieldLabel = React.forwardRef(({className, ...props}, ref) => (
    <Label ref={ref} className={cn(className)} {...props} />
));
FieldLabel.displayName = "FieldLabel";

export {Field, FieldLabel};
