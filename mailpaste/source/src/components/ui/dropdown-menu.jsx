import React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className = "", ...props }, ref) {
  return <Menu.Item ref={ref} className={`ui-menu-item ${className}`} {...props} />;
});
export const DropdownMenuContent = React.forwardRef(function DropdownMenuContent({ className = "", sideOffset = 8, ...props }, ref) {
  return <Menu.Portal><Menu.Content ref={ref} sideOffset={sideOffset} className={`ui-menu-content ${className}`} {...props} /></Menu.Portal>;
});
