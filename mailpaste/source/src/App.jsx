import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { parse } from "parse5";
import { basicSetup } from "codemirror";
import { html } from "@codemirror/lang-html";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Check, ChevronDown, Clipboard, Copy, FileCode2, Layers3, MousePointer2, Sparkles, Trash2 } from "lucide-react";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { Separator } from "./components/ui/separator";
import { ScrollArea } from "./components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { ENIGMA_TEMPLATE, SAVED_TEMPLATES } from "./templates/enigma";

const STORAGE_KEY = "mailpaste:last-html";
const REMOVED_TAGS = new Set(["script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "option", "meta", "base"]);
const INLINE_PROPERTIES = ["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-decoration", "vertical-align", "border", "border-top", "border-right", "border-bottom", "border-left", "border-radius", "padding", "margin", "display", "overflow", "opacity"];
const LLM_PROMPT = `You are an expert HTML email developer. Create or improve a production-ready email from the request below.

Requirements:
- Return only complete HTML suitable for pasting into Gmail; no Markdown fences, explanation, JavaScript, forms, iframes, or tracking scripts.
- Use a fluid, centered wrapper with a max width of 600–640px and table-based layout where it improves Outlook/Gmail reliability.
- Make it mobile responsive below 480px: single-column stacking, fluid images, readable 15–16px body text, comfortable tap targets, and no horizontal scrolling.
- Put critical visual styles inline on elements. You may also include a small style block for responsive media queries and class-based styles.
- Use web-safe font fallbacks such as Arial, Helvetica, sans-serif. Keep line-height generous and maintain accessible contrast.
- Use absolute HTTPS image URLs with width/height attributes, descriptive alt text, and no background-image-only content.
- Use real anchor links for CTAs, visible focus/hover states where supported, and clear link text. Do not use JavaScript or unsafe protocols.
- Preserve a clear hierarchy, a concise subject-like heading, and a single primary call to action unless the request says otherwise.
- Use placeholders like {{first_name}} only when personalization is requested. Keep copy concise and natural.

User request:
`;

function sanitizeHtml(raw) {
  const cleaned = DOMPurify.sanitize(raw, { RETURN_TRUSTED_TYPE: false, ADD_TAGS: ["style"], FORBID_TAGS: [...REMOVED_TAGS], FORBID_ATTR: ["srcdoc"] });
  const doc = new DOMParser().parseFromString(cleaned, "text/html");
  doc.querySelectorAll("script,iframe,object,embed,form,input,button,textarea,select,option,meta,base").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on") || name === "srcdoc" || /^(javascript|vbscript):/i.test(value) || /^data:text\/html/i.test(value)) node.removeAttribute(attribute.name);
      if (name === "href" || name === "src" || name === "action") {
        if (/^(javascript|vbscript|data:text)/i.test(value)) node.removeAttribute(attribute.name);
        else if (/^\//.test(value)) node.setAttribute(attribute.name, new URL(value, window.location.origin).href);
      }
    });
  });
  return doc;
}

function normalized(value) { return (value || "").replace(/\s+/g, " ").trim().slice(0, 100); }
function nodeText(node) { return (node.childNodes || []).map((child) => child.nodeName === "#text" ? child.value : nodeText(child)).join(" "); }
function nodeSignature(node) {
  const attrs = Object.fromEntries((node.attrs || []).map((item) => [item.name, item.value]));
  return [node.tagName, attrs.id || "", attrs.class || "", attrs.src || "", attrs.href || "", normalized(nodeText(node))].join("|");
}
function elementSignature(node) {
  return [node.tagName.toLowerCase(), node.id || "", node.className || "", node.getAttribute("src") || "", node.getAttribute("href") || "", normalized(node.textContent)].join("|");
}
function lineMapFor(raw) {
  const map = new Map();
  const tree = parse(raw, { sourceCodeLocationInfo: true });
  const walk = (node) => {
    if (node.tagName && node.sourceCodeLocation?.startLine) {
      const signature = nodeSignature(node);
      if (!map.has(signature)) map.set(signature, []);
      map.get(signature).push(node.sourceCodeLocation.startLine);
    }
    (node.childNodes || []).forEach(walk);
  };
  walk(tree);
  return map;
}
function attachSourceLines(root, raw) {
  const map = lineMapFor(raw);
  root.querySelectorAll("*").forEach((node) => {
    const matches = map.get(elementSignature(node));
    if (matches?.length) node.dataset.mailpasteLine = matches.shift();
  });
}
function findLineByText(raw, selected) {
  const target = normalized(selected).toLowerCase();
  if (!target) return 1;
  const lines = raw.split("\n");
  return Math.max(1, lines.findIndex((line) => normalized(line).toLowerCase().includes(target)) + 1);
}
function renderDocument(raw, annotate = true) {
  const doc = sanitizeHtml(raw);
  if (annotate) attachSourceLines(doc.body, raw);
  const head = doc.head.innerHTML;
  const body = doc.body.innerHTML;
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
    html,body{margin:0;padding:0;min-height:100%;background:#0d0f12;color:#e7e5df;}body{font-family:Arial,Helvetica,sans-serif;}img{max-width:100%;height:auto;}[data-mailpaste-line]{cursor:text;}[data-mailpaste-selected]{outline:2px solid #d5a84e!important;outline-offset:2px;}::highlight(mailpaste-selection){background:rgba(213,168,78,.35);color:inherit;}
  </style>${head}</head><body>${body}</body></html>`;
}

function sourceLine(view, line) {
  if (!view || !view.state.doc.lines) return;
  const safe = Math.min(Math.max(Number(line) || 1, 1), view.state.doc.lines);
  const target = view.state.doc.line(safe);
  view.dispatch({ selection: { anchor: target.from, head: target.to }, effects: EditorView.scrollIntoView(target.from, { y: "center" }) });
  view.focus();
}

function sourceText(view, selected, fallbackLine) {
  if (!view || !selected?.trim()) { sourceLine(view, fallbackLine); return fallbackLine; }
  const source = view.state.doc.toString();
  const needle = selected.trim();
  const candidates = [];
  const exact = source.indexOf(needle);
  if (exact >= 0) candidates.push({ index: exact, length: needle.length });
  const pattern = needle.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  if (pattern) {
    const matcher = new RegExp(pattern, "gi");
    let match;
    while ((match = matcher.exec(source)) && candidates.length < 80) candidates.push({ index: match.index, length: match[0].length });
  }
  if (!candidates.length) { sourceLine(view, fallbackLine); return fallbackLine; }
  const targetLine = Number(fallbackLine) || 1;
  const match = candidates.sort((a, b) => Math.abs(view.state.doc.lineAt(a.index).number - targetLine) - Math.abs(view.state.doc.lineAt(b.index).number - targetLine))[0];
  const from = match.index;
  const to = match.index + match.length;
  const line = view.state.doc.lineAt(from).number;
  view.dispatch({ selection: { anchor: from, head: to }, effects: EditorView.scrollIntoView(from, { y: "center" }) });
  view.focus();
  return line;
}

function ShortcutHint({ children, label }) {
  return <Tooltip><TooltipTrigger asChild><Badge className="shortcut-hint">{children}</Badge></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

const vesperHighlight = syntaxHighlighting(HighlightStyle.define([
  { tag: [t.tagName, t.angleBracket], color: "#99ffe4" },
  { tag: [t.attributeName, t.propertyName], color: "#ffcfa8" },
  { tag: [t.string, t.special(t.string)], color: "#f5c2e7" },
  { tag: [t.number, t.bool, t.constant(t.name)], color: "#d8aa52" },
  { tag: [t.keyword, t.operator], color: "#ff8080" },
  { tag: [t.comment], color: "#626862", fontStyle: "italic" },
  { tag: [t.variableName, t.name], color: "#d7d9d2" },
  { tag: [t.meta], color: "#b8a1ff" }
]));

const vesperEditorTheme = EditorView.theme({
  "&": { backgroundColor: "#101112", color: "#d7d9d2" },
  ".cm-content": { caretColor: "#ffcfa8" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#ffcfa8" },
  ".cm-gutters": { backgroundColor: "#101112", color: "#565d58", borderRight: "1px solid #242725" },
  ".cm-lineNumbers .cm-gutterElement": { color: "#565d58 !important" },
  ".cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": { color: "#b9bdb4 !important", backgroundColor: "#191c1b" },
  ".cm-activeLine": { backgroundColor: "rgba(153,255,228,.045)" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(153,255,228,.16) !important" },
  ".cm-matchingBracket": { color: "#ffcfa8 !important", backgroundColor: "rgba(255,207,168,.14)" }
}, { dark: true });

export default function App() {
  const initialHtml = useMemo(() => { try { return localStorage.getItem(STORAGE_KEY) || ENIGMA_TEMPLATE; } catch { return ENIGMA_TEMPLATE; } }, []);
  const [value, setValue] = useState(initialHtml);
  const [selectedLine, setSelectedLine] = useState(null);
  const [toast, setToast] = useState("");
  const [previewBg, setPreviewBg] = useState("#0d0f12");
  const editorHost = useRef(null);
  const editorView = useRef(null);
  const iframeRef = useRef(null);
  const toastTimer = useRef(null);
  const [previewRevision, setPreviewRevision] = useState(0);

  const notify = useCallback((message) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2200); }, []);
  const updateValue = useCallback((next) => {
    setValue(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private browsing can reject storage */ }
  }, []);

  useEffect(() => {
    const view = new EditorView({
      state: EditorState.create({ doc: initialHtml, extensions: [basicSetup, html(), vesperHighlight, vesperEditorTheme, EditorView.lineWrapping, EditorView.updateListener.of((update) => { if (update.docChanged) updateValue(update.state.doc.toString()); })] }),
      parent: editorHost.current
    });
    editorView.current = view;
    return () => view.destroy();
  }, [initialHtml, updateValue]);

  useEffect(() => {
    if (!editorView.current || editorView.current.state.doc.toString() === value) return;
    editorView.current.dispatch({ changes: { from: 0, to: editorView.current.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => () => { clearTimeout(toastTimer.current); }, []);

  const frameHtml = useMemo(() => renderDocument(value), [value]);
  useEffect(() => { setPreviewRevision((revision) => revision + 1); }, [frameHtml]);
  const onPreviewLoad = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;
    const selectionHandler = () => {
      const selection = doc.getSelection();
      const text = selection?.toString().trim();
      if (!text) return;
      const node = selection.anchorNode?.nodeType === 1 ? selection.anchorNode : selection.anchorNode?.parentElement;
      const target = node?.closest?.("[data-mailpaste-line]") || node;
      const line = Number(target?.dataset?.mailpasteLine) || findLineByText(value, text);
      doc.querySelectorAll("[data-mailpaste-selected]").forEach((item) => item.removeAttribute("data-mailpaste-selected"));
      if (doc.defaultView?.CSS?.highlights && selection.rangeCount && doc.defaultView.Highlight) {
        doc.defaultView.CSS.highlights.clear();
        doc.defaultView.CSS.highlights.set("mailpaste-selection", new doc.defaultView.Highlight(selection.getRangeAt(0).cloneRange()));
      } else if (target?.setAttribute) target.setAttribute("data-mailpaste-selected", "true");
      setSelectedLine(sourceText(editorView.current, text, line));
    };
    doc.addEventListener("selectionchange", selectionHandler);
    const candidates = [doc.body, ...doc.body.querySelectorAll("[style],body > *")];
    const background = candidates.map((node) => getComputedStyle(node).backgroundColor).find((color) => color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent");
    if (background) setPreviewBg(background);
    return () => doc.removeEventListener("selectionchange", selectionHandler);
  }, [value]);

  const copyPrompt = useCallback(async () => {
    const prompt = `${LLM_PROMPT}\n${value}`;
    try { await navigator.clipboard.writeText(prompt); notify("Prompt copied"); } catch { notify("Clipboard permission needed"); }
  }, [notify, value]);

  const copyEmail = useCallback(async () => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc?.body) return;
    const liveNodes = [...doc.body.querySelectorAll("*")];
    const clone = doc.body.cloneNode(true);
    const cloneNodes = [...clone.querySelectorAll("*")];
    liveNodes.forEach((live, index) => {
      const target = cloneNodes[index];
      if (!target) return;
      const styles = getComputedStyle(live);
      INLINE_PROPERTIES.forEach((property) => { const computed = styles.getPropertyValue(property); if (computed) target.style.setProperty(property, computed); });
      ["src", "href"].forEach((attribute) => {
        if (!target.hasAttribute(attribute)) return;
        try { target.setAttribute(attribute, new URL(target.getAttribute(attribute), doc.baseURI).href); } catch { /* keep malformed but harmless values untouched */ }
      });
      target.removeAttribute("data-mailpaste-line"); target.removeAttribute("data-mailpaste-selected");
    });
    const styleBlocks = [...doc.head.querySelectorAll("style")].map((style) => style.outerHTML).join("");
    const richHtml = `${styleBlocks}${clone.innerHTML}`;
    const plainText = clone.innerText || clone.textContent || "";
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([richHtml], { type: "text/html" }), "text/plain": new Blob([plainText], { type: "text/plain" }) })]);
      } else {
        const holder = document.createElement("div"); holder.contentEditable = "true"; holder.style.position = "fixed"; holder.style.left = "-9999px"; holder.innerHTML = richHtml; document.body.appendChild(holder);
        const range = document.createRange(); range.selectNodeContents(holder); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); document.execCommand("copy"); selection.removeAllRanges(); holder.remove();
      }
      notify("Copied for Gmail");
    } catch { notify("Clipboard permission needed"); }
  }, [notify]);

  useEffect(() => {
    const handleKey = (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;
      if (event.key.toLowerCase() === "c" && event.shiftKey) { event.preventDefault(); copyPrompt(); return; }
      if (event.key.toLowerCase() === "c" && !event.shiftKey) {
        const selection = editorView.current?.state.selection;
        if (selection && !selection.main.empty) return;
        event.preventDefault(); copyEmail();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [copyEmail, copyPrompt]);

  const paste = async () => { try { updateValue(await navigator.clipboard.readText()); notify("Pasted"); } catch { notify("Clipboard permission needed"); } };
  const clear = () => { updateValue(""); setSelectedLine(null); notify("Cleared"); };
  const loadTemplate = (template) => { updateValue(template.html); setSelectedLine(null); notify(`${template.name} loaded`); };

  return <TooltipProvider delayDuration={200}>
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">M</span><span>MailPaste</span></div>
        <div className="top-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button className="template-trigger"><Layers3 size={15} /> Templates <ChevronDown size={14} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SAVED_TEMPLATES.map((template) => <DropdownMenuItem key={template.id} onSelect={() => loadTemplate(template)}><FileCode2 size={15} /><span><strong>{template.name}</strong><small>{template.description}</small></span></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator />
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" className="action-button" onClick={copyPrompt}><Sparkles size={15} /> Copy prompt <ShortcutHint label="Copy prompt"><kbd>⌘⇧C</kbd></ShortcutHint></Button></TooltipTrigger><TooltipContent>Copy an LLM-ready email brief</TooltipContent></Tooltip>
          <Button variant="ghost" className="action-button" onClick={paste}><Clipboard size={15} /> Paste</Button>
          <Button variant="ghost" className="action-button" onClick={clear}><Trash2 size={15} /> Clear</Button>
        </div>
      </header>

      <section className="workspace-card">
        <ResizablePanelGroup direction="horizontal" className="workspace-panels">
          <ResizablePanel defaultSize={48} minSize={32} className="workspace-panel editor-panel">
            <div className="panel-heading"><div className="panel-title"><span className="status-dot" /> HTML source <span className="panel-meta">{value.split("\n").length} lines</span></div><span className="panel-label">{selectedLine ? `line ${selectedLine}` : "live"}</span></div>
            <ScrollArea className="editor-scroll"><div ref={editorHost} className="code-editor" /></ScrollArea>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={52} minSize={32} className="workspace-panel preview-panel">
            <div className="panel-heading"><div className="panel-title"><span className="status-dot" /> Preview {selectedLine && <span className="selection-note"><MousePointer2 size={13} /> source line {selectedLine}</span>}</div><Tooltip><TooltipTrigger asChild><Button variant="gold" size="sm" onClick={copyEmail}><Copy size={15} /> Copy <ShortcutHint label="Copy rendered email"><kbd>⌘C</kbd></ShortcutHint></Button></TooltipTrigger><TooltipContent>Copy HTML + plain text for Gmail</TooltipContent></Tooltip></div>
            <div className="preview-stage" style={{ "--preview-bg": previewBg }}><iframe ref={iframeRef} title="Rendered email preview" sandbox="allow-same-origin" srcDoc={frameHtml} onLoad={onPreviewLoad} /></div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </section>
      <footer className="statusbar"><span>Select text in the preview to jump to its source line</span><span className="footer-shortcuts"><kbd>⌘C</kbd> copy <kbd>⌘⇧C</kbd> prompt</span></footer>
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </main>
  </TooltipProvider>;
}
