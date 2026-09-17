import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = React.forwardRef(function TooltipContent({ className = "", sideOffset = 6, ...props }, ref) {
  return <TooltipPrimitive.Portal><TooltipPrimitive.Content ref={ref} sideOffset={sideOffset} className={`ui-tooltip ${className}`} {...props} /></TooltipPrimitive.Portal>;
});
