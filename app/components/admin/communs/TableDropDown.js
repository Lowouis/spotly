import React from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
} from "@nextui-org/react";

export default function TableDropDown({icon, items}) {
    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    variant="flat"
                    isIconOnly
                >
                    {icon}
                </Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="filterBy"
                variant="flat"
                closeOnSelect={false}
                disallowEmptySelection
                selectionMode="multiple"
                items={items}

            >
                {(item) => (
                    <DropdownItem
                        key={item.key}
                        className={item.key === "delete" ? "text-danger" : ""}
                        color={item.key === "delete" ? "danger" : "default"}
                    >
                        {item.label}
                    </DropdownItem>
                )}
            </DropdownMenu>
        </Dropdown>
    );
}
