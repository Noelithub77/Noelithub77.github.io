import React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export function ResizablePanelGroup(props) { return <PanelGroup {...props} />; }
export function ResizablePanel(props) { return <Panel {...props} />; }
export function ResizableHandle({ className = "" }) { return <PanelResizeHandle className={`ui-resize-handle ${className}`} />; }
