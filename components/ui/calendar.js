"use client";

import * as React from "react";
import {DayPicker} from "react-day-picker";

import {buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";

function Calendar({className, classNames, showOutsideDays = true, ...props}) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 text-sm", className)}
            classNames={{
                root: "w-fit text-foreground",
                months: "flex flex-col",
                month: "space-y-3",
                month_caption: "flex h-9 items-center justify-center",
                caption_label: "text-sm font-semibold text-foreground",
                nav: "flex items-center justify-between",
                button_previous: cn(buttonVariants({variant: "ghost"}), "absolute left-3 top-3 h-8 w-8 p-0 text-foreground"),
                button_next: cn(buttonVariants({variant: "ghost"}), "absolute right-3 top-3 h-8 w-8 p-0 text-foreground"),
                chevron: "h-4 w-4",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex gap-1",
                weekday: "w-9 rounded-md text-center text-xs font-medium text-muted-foreground",
                week: "mt-1 flex w-full gap-1",
                day: "h-9 w-9 p-0 text-center text-sm",
                day_button: cn(buttonVariants({variant: "ghost"}), "h-9 w-9 p-0 text-sm font-normal text-foreground aria-selected:opacity-100"),
                selected: "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground",
                today: "[&_button]:bg-accent [&_button]:text-accent-foreground",
                outside: "text-muted-foreground opacity-50 [&_button]:text-muted-foreground",
                disabled: "text-muted-foreground opacity-50 [&_button]:text-muted-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export {Calendar};
