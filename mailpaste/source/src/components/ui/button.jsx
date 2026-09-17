import React from "react";
import { cn } from "../../lib/utils";

export function Button({ className = "", variant = "outline", size = "default", ...props }) {
  return <button className={cn("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)} {...props} />;
}
