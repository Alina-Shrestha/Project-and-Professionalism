"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  cloneElement,
  isValidElement,
  useState,
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
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center"
      aria-haspopup="menu"
      aria-expanded={ctx.open}
    >
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
      aria-hidden={!ctx.open}
    >
      {children}
    </div>
  );
}

export function NotificationBell({
  count = 0,
  notifications = [],
}: {
  count?: number;
  notifications?: { id: string; title: string; body?: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex items-center p-1 rounded hover:bg-muted/10"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            role="img"
          >
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 01-3.46 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {count > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-red-600 text-white">
              {count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-2">
        <div className="text-sm text-muted-foreground p-2">
          {notifications.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-2 border-b last:border-b-0">
                <div className="font-medium text-sm">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}