import { Children, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

const STATUS_VALUES = new Set(["working", "suspicious", "not_working", "done", "not_done", "pending", "unavailable"]);
export default function StatusSelect({ value, onChange, children, disabled, className = "", name, "aria-label": label = "Select an option" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const listId = useId();
  const options = Children.toArray(children).filter((child) => child?.props?.value !== undefined);
  const selected = options.find((option) => String(option.props.value) === String(value));
  const hasStatusColors = options.some((option) => STATUS_VALUES.has(option.props.value));
  const widthClasses = className.split(/\s+/).filter((name) => /^(?:[a-z]+:)?(?:w-|min-w-|max-w-|flex-)/.test(name)).join(" ");
  useEffect(() => {
    if (!open) return;
    const close = (event) => { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    const reposition = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 170), window.innerWidth - 16);
      const estimatedHeight = Math.min(options.length * 38 + 10, 240);
      const top = rect.bottom + estimatedHeight + 8 > window.innerHeight ? Math.max(8, rect.top - estimatedHeight - 5) : rect.bottom + 5;
      setPosition({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width });
    };
    reposition();
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); window.removeEventListener("resize", reposition); window.removeEventListener("scroll", reposition, true); };
  }, [open, options.length]);
  useEffect(() => {
    if (open && position && document.activeElement === trigger.current) {
      menu.current?.querySelector('[aria-selected="true"]:not(:disabled)')?.focus();
    }
  }, [open, position]);
  const handleMenuKeys = (event) => {
    if (event.key === "Tab") { setOpen(false); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...menu.current.querySelectorAll('[role="option"]:not(:disabled)')];
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[index]?.focus();
  };
  return <span className={`custom-select-wrap ${widthClasses}`}>
    {name && <input type="hidden" name={name} value={value ?? ""} />}
    <button ref={trigger} type="button" className={`status-select status-${value}`} disabled={disabled} aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? listId : undefined} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setTimeout(() => menu.current?.querySelector('[aria-selected="true"]')?.focus(), 0); } }}>
      {hasStatusColors && <span className="status-select-dot"/>}<span className="custom-select-value">{selected?.props.children ?? value}</span><ChevronDown size={14}/>
    </button>
    {open && position && createPortal(<div ref={menu} id={listId} className="status-menu" role="listbox" aria-label={label} onKeyDown={handleMenuKeys} style={{ top: position.top, left: position.left, width: position.width }}>{options.map((option) => <button type="button" role="option" aria-selected={String(option.props.value) === String(value)} disabled={option.props.disabled} key={String(option.props.value)} onClick={() => { onChange({ target: { value: option.props.value, name } }); setOpen(false); trigger.current?.focus(); }}>{hasStatusColors && <span className={`status-option-dot status-${option.props.value}`}/>}<span>{option.props.children}</span>{String(option.props.value) === String(value) && <Check size={15}/>}</button>)}</div>, document.body)}
  </span>;
}
