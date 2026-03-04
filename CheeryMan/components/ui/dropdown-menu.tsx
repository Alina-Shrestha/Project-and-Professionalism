"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  cloneElement,
  isValidElement,
} from "react";

type DropdownContext = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DropdownCtx = createContext<DropdownContext>({});

export function DropdownMenu({
  children,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownCtx.Provider value={{ open, onOpenChange }}>
      <div className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const ctx = useContext(DropdownCtx);
  const toggle = (e?: React.MouseEvent) => ctx.onOpenChange?.(!ctx.open);

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      onClick: (ev: React.MouseEvent) => {
        (children as any).props.onClick?.(ev);
        toggle(ev);
      },
    });
  }

  return (
    <button type="button" onClick={toggle} className="inline-flex items-center">
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = "start",
  className = "",
}: {
  children: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const ctx = useContext(DropdownCtx);
  if (!ctx.open) return null;

  let alignClass = "left-0";
  if (align === "end") alignClass = "right-0";
  if (align === "center") alignClass = "left-1/2 transform -translate-x-1/2";

  return (
    <div
      className={`absolute z-50 mt-2 ${alignClass} ${className}`}
      role="menu"
    >
      {children}
    </div>
  );
}