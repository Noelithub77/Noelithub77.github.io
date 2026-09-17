import React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

export const ScrollArea = React.forwardRef(function ScrollArea({ className = "", children, ...props }, ref) {
  return <ScrollAreaPrimitive.Root ref={ref} className={`ui-scroll-area ${className}`} {...props}>
    <ScrollAreaPrimitive.Viewport className="ui-scroll-viewport">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="ui-scrollbar"><ScrollAreaPrimitive.Thumb className="ui-scroll-thumb" /></ScrollAreaPrimitive.Scrollbar>
  </ScrollAreaPrimitive.Root>;
});
