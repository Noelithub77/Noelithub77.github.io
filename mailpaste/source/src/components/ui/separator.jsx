import React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

export function Separator({ className = "", ...props }) {
  return <SeparatorPrimitive.Root decorative orientation="vertical" className={`ui-separator ${className}`} {...props} />;
}
