"use client";

import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cn} from "@/lib/utils";

const Sidebar = React.forwardRef(({className, ...props}, ref) => (
    <aside ref={ref} className={cn("group/sidebar flex h-screen w-64 shrink-0 flex-col border-r bg-background text-foreground", className)} {...props} />
));
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("border-b p-3", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef(({asChild = false, className, ...props}, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp ref={ref} className={cn("flex h-9 w-full items-center justify-start rounded-md px-2 text-left text-xs font-semibold text-muted-foreground", className)} {...props} />;
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("mt-1", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef(({className, ...props}, ref) => (
    <ul ref={ref} className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({className, ...props}, ref) => (
    <li ref={ref} className={cn("min-w-0", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef(({asChild = false, isActive = false, className, ...props}, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            ref={ref}
            data-active={isActive}
            className={cn(
                "flex h-9 w-full min-w-0 items-center justify-start gap-2 rounded-md px-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-semibold",
                className
            )}
            {...props}
        />
    );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarRail = React.forwardRef(({className, ...props}, ref) => (
    <div ref={ref} className={cn("pointer-events-none absolute inset-y-0 right-0 w-px bg-border", className)} {...props} />
));
SidebarRail.displayName = "SidebarRail";

export {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
};
