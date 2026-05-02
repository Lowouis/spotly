"use client";

import {useEffect, useState} from "react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";

export const calendarValueToDate = (value) => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return new Date(value.year, value.month - 1, value.day);
};

export const dateToCalendarValue = (date) => {
    if (!date) return null;
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
};

export default function ShadcnDatePicker({label, value, onChange, min, max, disabled, required, invalid, isDateDisabled}) {
    const selectedDate = calendarValueToDate(value);
    const minDate = calendarValueToDate(min);
    const maxDate = calendarValueToDate(max);
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(selectedDate || minDate || new Date());
    const selectedYear = selectedDate?.getFullYear();
    const selectedMonth = selectedDate?.getMonth();

    useEffect(() => {
        if (selectedYear === undefined || selectedMonth === undefined) return;
        setMonth((currentMonth) => {
            if (
                currentMonth.getFullYear() === selectedYear &&
                currentMonth.getMonth() === selectedMonth
            ) {
                return currentMonth;
            }
            return new Date(selectedYear, selectedMonth, 1);
        });
    }, [selectedYear, selectedMonth]);

    return (
        <div className="flex flex-col gap-2 my-2">
            <label className="flex h-5 items-center text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                {label}{required ? " *" : ""}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={invalid}
                        className={cn(
                            "h-11 w-full justify-start rounded-lg border-neutral-300 bg-white px-3 text-sm font-normal leading-none text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
                            !selectedDate && "text-muted-foreground",
                            invalid && "border-red-500 focus-visible:ring-red-500"
                        )}
                    >
                        {selectedDate ? format(selectedDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            onChange(dateToCalendarValue(date), date);
                            if (date) setOpen(false);
                        }}
                        month={month}
                        onMonthChange={setMonth}
                        disabled={(date) => {
                            return (minDate && date < minDate) || (maxDate && date > maxDate) || isDateDisabled?.(date);
                        }}
                        initialFocus
                        locale={fr}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
