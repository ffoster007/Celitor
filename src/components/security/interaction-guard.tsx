"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

type MenuState =
  | { open: false }
  | { open: true; x: number; y: number; reason: "mouse" | "keyboard" };

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
}

export function InteractionGuard() {
  const { status } = useSession();
  const enabled = status === "authenticated";

  if (!enabled) return null;

  return <AuthenticatedInteractionGuard />;
}

function AuthenticatedInteractionGuard() {
  const [menu, setMenu] = useState<MenuState>({ open: false });
  const [viewMode, setViewMode] = useState(false);
  const menuOpenRef = useRef(false);
  const lastPointer = useRef<{ x: number; y: number }>({ x: 12, y: 12 });

  const blockedKeys = useMemo(() => {
    return {
      // DevTools-related
      devtools: new Set(["I", "J", "C", "K", "E"]),
      // View source
      viewSource: new Set(["U"]),
    };
  }, []);

  useEffect(() => {
    menuOpenRef.current = menu.open;
  }, [menu.open]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (viewMode) {
        document.documentElement.setAttribute("data-celitor-view-mode", "true");
      } else {
        document.documentElement.removeAttribute("data-celitor-view-mode");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-celitor-view-mode");
      }
    };
  }, [viewMode]);

  useEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const openMenuAt = (x: number, y: number, reason: "mouse" | "keyboard") => {
      const menuWidth = 240;
      const menuHeight = 220;
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - menuWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - menuHeight - margin);
      setMenu({
        open: true,
        x: clamp(x, margin, maxX),
        y: clamp(y, margin, maxY),
        reason,
      });
    };

    const closeMenu = () => setMenu({ open: false });

    const onPointerMove = (e: PointerEvent) => {
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openMenuAt(e.clientX, e.clientY, "mouse");
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!menuOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.("[data-celitor-context-menu]")) return;
      closeMenu();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Allow normal typing in inputs
      if (isEditableTarget(e.target)) {
        if (e.key === "Escape" && menuOpenRef.current) {
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
        }
        return;
      }

      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const metaAlt = e.metaKey && e.altKey;

      // Close menu
      if (key === "Escape" && menuOpenRef.current) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        return;
      }

      // Open context menu via keyboard keys
      if (key === "ContextMenu" || (e.shiftKey && key === "F10")) {
        e.preventDefault();
        e.stopPropagation();
        openMenuAt(lastPointer.current.x, lastPointer.current.y, "keyboard");
        return;
      }

      // Block DevTools keys
      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (ctrlOrMeta && e.shiftKey && blockedKeys.devtools.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // macOS Chrome/Safari-style DevTools shortcuts (Cmd+Opt+I/J/C)
      if (metaAlt && blockedKeys.devtools.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block view-source shortcut
      if (ctrlOrMeta && blockedKeys.viewSource.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // macOS view-source (Cmd+Opt+U)
      if (metaAlt && blockedKeys.viewSource.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
      closeMenu();
    };
  }, [blockedKeys]);

  if (!menu.open) return null;

  return (
    <div
      data-celitor-context-menu
      role="menu"
      aria-label="Celitor context menu"
      className="fixed z-[9999] min-w-[220px] select-none overflow-hidden rounded-xl bg-white/90 text-zinc-900 shadow-lg ring-1 ring-zinc-200/70 backdrop-blur dark:bg-zinc-950/85 dark:text-zinc-50 dark:ring-zinc-800"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100/70 focus-visible:bg-zinc-100/70 focus-visible:outline-none dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-900/70 cursor-pointer"
        onClick={() => setMenu({ open: false })}
      >
        Brige
      </button>

      <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />

      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100/70 focus-visible:bg-zinc-100/70 focus-visible:outline-none dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-900/70 cursor-pointer"
        onClick={() => setViewMode((v) => !v)}
      >
        View mode
      </button>

      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100/70 focus-visible:bg-zinc-100/70 focus-visible:outline-none dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-900/70 cursor-pointer" 
        onClick={() => {
          setViewMode(false);
          setMenu({ open: false });
        }}
      >
        Reset
      </button>

      <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />

      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100/70 focus-visible:bg-zinc-100/70 focus-visible:outline-none dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-900/70 cursor-pointer"
        onClick={() => setMenu({ open: false })}
      >
        Close
      </button>
    </div>
  );
}
