"use client";

import React, { useEffect, useRef } from "react";
import { FileText, Bookmark } from "lucide-react";

interface FileContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    filePath: string;
    fileName: string;
}

interface FileContextMenuProps {
    state: FileContextMenuState;
    onClose: () => void;
    onViewFile: (filePath: string) => void;
    onBookmark: (filePath: string, fileName: string, fileType: "file" | "dir") => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
    state,
    onClose,
    onViewFile,
    onBookmark,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!state.isOpen) return;

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

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [state.isOpen, onClose]);

    if (!state.isOpen) return null;

    // Determine if this is a file or directory based on the path
    const isFile = state.fileName.includes(".") || !state.filePath.endsWith("/");
    const fileType = isFile ? "file" : "dir";

    const handleViewFile = () => {
        onViewFile(state.filePath);
        onClose();
    };

    const handleBookmark = () => {
        onBookmark(state.filePath, state.fileName, fileType);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[180px] rounded-lg border border-white bg-gray-900 py-1 shadow-xl"
            style={{
                left: `${state.position.x}px`,
                top: `${state.position.y}px`,
            }}
        >
            {/* View File option */}
            {isFile && (
                <button
                    onClick={handleViewFile}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
                >
                    <FileText className="h-4 w-4" />
                    <span>View File</span>
                </button>
            )}

            {/* Bookmark option */}
            <button
                onClick={handleBookmark}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
            >
                <Bookmark className="h-4 w-4" />
                <span>Bookmark</span>
            </button>
        </div>
    );
};

export type { FileContextMenuState };
