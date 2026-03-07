import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export default function Dropdown({ label, options, value, onChange, className = "", fullWidth }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(!open);
  };

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={btnRef} className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors ${
          fullWidth ? "w-full justify-between" : "shrink-0"
        }`}
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-surface border border-border rounded-lg shadow-lg z-[60] py-1 max-h-[240px] overflow-y-auto"
          style={{ top: pos.top, left: pos.left, minWidth: Math.max(pos.width, 180) }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                opt.value === value
                  ? "bg-magenta/15 text-magenta"
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
