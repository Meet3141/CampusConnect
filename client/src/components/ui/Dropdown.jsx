import React, { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../utils/cn";

const DropdownContext = createContext(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) {
    throw new Error("Dropdown components must be used within <Dropdown>");
  }
  return ctx;
}

const ALIGNMENTS = {
  left: "left-0",
  right: "right-0",
  center: "left-1/2 -translate-x-1/2",
};

const SIDES = {
  bottom: "top-full mt-2",
  top: "bottom-full mb-2",
};

const WIDTHS = {
  sm: "min-w-[10rem]",
  md: "min-w-[14rem]",
  lg: "min-w-[18rem]",
};

/**
 * Dropdown — composable dropdown menu system.
 *
 * Usage:
 *  <Dropdown>
 *    <Dropdown.Trigger>Open</Dropdown.Trigger>
 *    <Dropdown.Menu>
 *      <Dropdown.Item>Profile</Dropdown.Item>
 *      <Dropdown.Item>Settings</Dropdown.Item>
 *    </Dropdown.Menu>
 *  </Dropdown>
 */
export default function Dropdown({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = "left",
  side = "bottom",
  width = "md",
  className,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const containerRef = useRef(null);
  const baseId = useId();

  const setOpen = (next) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      align,
      side,
      width,
      triggerId: `${baseId}-trigger`,
      menuId: `${baseId}-menu`,
    }),
    [open, align, side, width, baseId]
  );

  return (
    <DropdownContext.Provider value={value}>
      <div ref={containerRef} className={cn("relative inline-flex", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

Dropdown.Trigger = function DropdownTrigger({ children, className, asChild = false }) {
  const { open, setOpen, triggerId, menuId } = useDropdownContext();

  const handleClick = (event, childOnClick) => {
    childOnClick?.(event);
    if (!event.defaultPrevented) {
      setOpen(!open);
    }
  };

  const triggerProps = {
    id: triggerId,
    type: "button",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": menuId,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...triggerProps,
      onClick: (event) => handleClick(event, children.props?.onClick),
      className: cn(children.props?.className, className),
    });
  }

  return (
    <button
      {...triggerProps}
      onClick={(event) => handleClick(event)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-body-sm",
        "text-text-primary transition-fast-premium hover:border-border-hover hover:bg-surface-hover",
        className
      )}
    >
      {children}
    </button>
  );
};

Dropdown.Menu = function DropdownMenu({ children, className }) {
  const { open, align, side, width, menuId, triggerId } = useDropdownContext();

  if (!open) return null;

  return (
    <div
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      className={cn(
        "absolute z-dropdown rounded-xl border border-border-subtle bg-surface shadow-overlay",
        "py-1 text-text-primary animate-fade-in",
        ALIGNMENTS[align] ?? ALIGNMENTS.left,
        SIDES[side] ?? SIDES.bottom,
        WIDTHS[width] ?? WIDTHS.md,
        className
      )}
    >
      {children}
    </div>
  );
};

Dropdown.Item = function DropdownItem({
  children,
  onSelect,
  closeOnSelect = true,
  disabled = false,
  className,
}) {
  const { setOpen } = useDropdownContext();

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        if (closeOnSelect) setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm",
        "text-text-primary transition-fast-premium hover:bg-surface-hover",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
};

Dropdown.Separator = function DropdownSeparator({ className }) {
  return <div className={cn("my-1 h-px bg-border-subtle", className)} role="separator" />;
};

Dropdown.Label = function DropdownLabel({ children, className }) {
  return (
    <div className={cn("px-3 py-1 text-micro font-semibold text-text-muted", className)}>
      {children}
    </div>
  );
};
