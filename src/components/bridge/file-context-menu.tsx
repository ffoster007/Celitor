"use client";

import React, { useEffect, useRef } from "react";
import { Network, FileCode } from "lucide-react";
import type { FileContextMenuState } from "@/types/bridge";

interface FileContextMenuProps {
  state: FileContextMenuState;
  onClose: () => void;
  onBridge: (filePath: string) => void;
  onViewFile?: (filePath: string) => void;
  onCopyPath?: (filePath: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  state,
  onClose,
  onBridge,
  onViewFile,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (state.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [state.isOpen, onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current && state.isOpen) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = state.position;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [state.position, state.isOpen]);

  if (!state.isOpen) return null;

  // Check if the file is analyzable (code files)
  const isAnalyzable = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte)$/i.test(state.filePath);

  const handleBridge = () => {
    onBridge(state.filePath);
    onClose();
  };

  const handleViewFile = () => {
    onViewFile?.(state.filePath);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-celitor-allow-context-menu
      className="fixed z-[100] min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden"
      style={{
        left: state.position.x,
        top: state.position.y,
      }}
    >
      {/* File name header */}
      <div className="px-3 py-2 border-b border-slate-700">
        <p className="text-xs text-slate-400 truncate max-w-[200px]" title={state.fileName}>
          {state.fileName}
        </p>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {/* Bridge option - only for analyzable files */}
        {isAnalyzable && (
          <button
            onClick={handleBridge}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-blue-600/30 hover:text-blue-200 transition-colors cursor-pointer"
          >
            <Network className="h-4 w-4 text-blue-400" />
            <span>Bridge</span>
            <span className="ml-auto text-xs text-slate-500">Analyze deps</span>
          </button>
        )}

        {/* View file */}
        {onViewFile && (
          <button
            onClick={handleViewFile}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FileCode className="h-4 w-4 text-slate-400" />
            <span>View File</span>
          </button>
        )}

        {/* Copy path */}

        {/* Divider */}
        <div className="my-1 border-t border-slate-700" />

        {/* Info text for non-analyzable files */}
        {!isAnalyzable && (
          <div className="px-3 py-2 text-xs text-slate-500">
            Bridge analysis is only available for code files (.ts, .tsx, .js, .jsx)
          </div>
        )}
      </div>
    </div>
  );
};

export default FileContextMenu;
