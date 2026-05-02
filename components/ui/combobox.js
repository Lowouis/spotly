"use client";

import * as React from "react";
import {Check, ChevronsUpDown} from "lucide-react";

import {cn} from "@/lib/utils";

const ComboboxContext = React.createContext(null);

function useCombobox() {
    const context = React.useContext(ComboboxContext);
    if (!context) throw new Error("Combobox components must be used inside Combobox");
    return context;
}

function Combobox({items = [], value, onValueChange, itemToString = String, itemToValue = String, children, className}) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const rootRef = React.useRef(null);
    const listId = React.useId();

    React.useEffect(() => {
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, []);

    const selectedItem = React.useMemo(
        () => items.find((item) => itemToValue(item) === value),
        [items, itemToValue, value]
    );

    const filteredItems = React.useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return items;

        return items.filter((item) => itemToString(item).toLowerCase().includes(normalizedQuery));
    }, [items, itemToString, query]);

    return (
        <ComboboxContext.Provider value={{
            open,
            setOpen,
            query,
            setQuery,
            value,
            onValueChange,
            selectedItem,
            filteredItems,
            itemToString,
            itemToValue,
            listId,
        }}>
            <div ref={rootRef} className={cn("relative", className)}>
                {children}
            </div>
        </ComboboxContext.Provider>
    );
}

function ComboboxInput({placeholder, className}) {
    const {open, setOpen, query, setQuery, selectedItem, itemToString, listId} = useCombobox();

    return (
        <div className="relative">
            <input
                type="text"
                role="combobox"
                aria-controls={listId}
                aria-expanded={open ? "true" : "false"}
                value={open ? query : selectedItem ? itemToString(selectedItem) : ""}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                }}
                className={cn(
                    "h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring",
                    className
                )}
            />
            <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
}

function ComboboxContent({children, className}) {
    const {open} = useCombobox();
    if (!open) return null;

    return (
        <div className={cn("absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}>
            {children}
        </div>
    );
}

function ComboboxEmpty({children, className}) {
    const {filteredItems} = useCombobox();
    if (filteredItems.length > 0) return null;

    return <div className={cn("px-2 py-3 text-center text-sm text-muted-foreground", className)}>{children}</div>;
}

function ComboboxList({children, className}) {
    const {filteredItems, listId} = useCombobox();

    return (
        <div id={listId} role="listbox" className={cn("max-h-60 overflow-auto", className)}>
            {filteredItems.map((item) => children(item))}
        </div>
    );
}

function ComboboxItem({value, children, className}) {
    const {value: selectedValue, onValueChange, setOpen, setQuery} = useCombobox();
    const selected = selectedValue === value;

    return (
        <button
            type="button"
            role="option"
            aria-selected={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
                onValueChange?.(value);
                setQuery("");
                setOpen(false);
            }}
            className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                selected && "bg-accent text-accent-foreground",
                className
            )}
        >
            <span className="truncate">{children}</span>
            {selected && <Check className="ml-2 h-4 w-4 shrink-0" />}
        </button>
    );
}

export {Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem};
