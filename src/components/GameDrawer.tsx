"use client";

import { useEffect, type ReactNode } from "react";

export type DrawerSection =
  | "upgrades"
  | "learning"
  | "progress"
  | "settings"
  | "sources";

const NAV: { id: DrawerSection; label: string }[] = [
  { id: "upgrades", label: "Upgrades" },
  { id: "learning", label: "Learning" },
  { id: "progress", label: "Progress" },
  { id: "settings", label: "Settings" },
  { id: "sources", label: "Sources" },
];

interface GameDrawerProps {
  open: boolean;
  section: DrawerSection;
  onSectionChange: (section: DrawerSection) => void;
  onClose: () => void;
  children: ReactNode;
  learningBadge?: boolean;
}

export function GameDrawer({
  open,
  section,
  onSectionChange,
  onClose,
  children,
  learningBadge,
}: GameDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(100vw,26rem)] flex-col border-l border-edge bg-panel/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out sm:w-[24rem] md:w-[26rem] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Game menu"
      >
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-text">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-edge px-2.5 py-1 font-mono text-xs text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-edge px-2 py-2">
          {NAV.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`relative shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                  active
                    ? "bg-accent-soft text-accent-text"
                    : "text-muted hover:bg-panel-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {item.id === "learning" && learningBadge && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {children}
        </div>
      </aside>
    </>
  );
}
