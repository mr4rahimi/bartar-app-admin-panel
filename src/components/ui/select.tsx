// src/components/ui/select.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';

type SelectContextType = {
  value: string | null;
  defaultValue?: string | null;
  onChange?: (v: string) => void;
  open?: boolean;
  setOpen?: (v: boolean) => void;
};

const SelectContext = createContext<SelectContextType | null>(null);

type SelectProps = {
  children?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
};

export const Select: React.FC<SelectProps> = ({ children, defaultValue, value, onValueChange, className }) => {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const [open, setOpen] = useState(false);

  // controlled vs uncontrolled
  const currentValue = value ?? internalValue;
  const handleChange = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternalValue(v);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        defaultValue: defaultValue ?? null,
        onChange: handleChange,
        open,
        setOpen,
      }}
    >
      <div className={className ?? 'inline-block relative'}>{children}</div>
    </SelectContext.Provider>
  );
};

export default Select;

/* ---------- Trigger ---------- */
type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; children?: React.ReactNode };

export const SelectTrigger: React.FC<TriggerProps> = ({ children, className = '', ...rest }) => {
  const ctx = useContext(SelectContext);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  if (!ctx) {
    console.warn('SelectTrigger must be used inside Select');
    return null;
  }

  const { open, setOpen } = ctx;

  const toggle = () => setOpen?.(!open);

  return (
    <button
      type="button"
      ref={btnRef}
      onClick={toggle}
      className={`${className} flex items-center justify-between gap-2 border p-2 rounded bg-white`}
      {...rest}
    >
      {children}
      <svg
        className="w-4 h-4 ml-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
};

/* ---------- Value (display inside Trigger) ---------- */
type ValueProps = { placeholder?: string; className?: string };

export const SelectValue: React.FC<ValueProps> = ({ placeholder = 'انتخاب کنید', className = '' }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    console.warn('SelectValue must be used inside Select');
    return null;
  }
  const { value } = ctx;
  return <span className={`${className} truncate`}>{value ?? placeholder}</span>;
};

/* ---------- Content (dropdown) ---------- */
type ContentProps = React.HTMLAttributes<HTMLDivElement> & { className?: string; children?: React.ReactNode };

export const SelectContent: React.FC<ContentProps> = ({ children, className = '', ...rest }) => {
  const ctx = useContext(SelectContext);
  const ref = useRef<HTMLDivElement | null>(null);

  if (!ctx) {
    console.warn('SelectContent must be used inside Select');
    return null;
  }

  const { open, setOpen } = ctx;

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen?.(false);
      }
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 min-w-[160px] max-h-60 overflow-auto rounded border bg-white shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

/* ---------- Item ---------- */
type ItemProps = {
  value: string;
  children?: React.ReactNode;
  className?: string;
};

export const SelectItem: React.FC<ItemProps> = ({ value, children, className = '' }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    console.warn('SelectItem must be used inside Select');
    return null;
  }

  const { onChange, setOpen } = ctx;

  const onClick = () => {
    onChange?.(value);
    setOpen?.(false);
  };

  return (
    <div
      role="option"
      onClick={onClick}
      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${className}`}
      data-value={value}
    >
      {children}
    </div>
  );
};

/* ---------- exports for convenience ---------- */
export { SelectItem as SelectOption, SelectContent as SelectDropdown, SelectTrigger as SelectButton };
