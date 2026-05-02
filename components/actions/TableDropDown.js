import React from "react";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

export default function TableDropDown({icon, items}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    size="icon"
                >
                    {icon}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                aria-label="filterBy"
            >
                {items.map((item) => (
                    <DropdownMenuCheckboxItem
                        key={item.key}
                        className={item.key === "delete" ? "text-red-500" : ""}
                    >
                        {item.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
