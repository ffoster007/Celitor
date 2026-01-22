"use client";

import React, { useState, useRef, useEffect } from "react";
import { Folder, Plus } from "lucide-react";
import type { Album } from "@/types/album";

interface BookmarkModalProps {
  isOpen: boolean;
  filePath: string;
  fileName: string;
  fileType: "file" | "dir";
  albums: Album[];
  onClose: () => void;
  onSave: (albumId: string) => void;
  onCreate: (name: string) => Promise<Album | null>;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen, filePath, fileName, albums, onClose, onSave, onCreate,
}) => {
  const defaultId = albums.length > 0 ? albums[0].id : null;
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(defaultId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state via key from parent instead of useEffect
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handler);
    }
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (creating && newName) {
      setLoading(true);
      const album = await onCreate(newName);
      setLoading(false);
      if (album) {
        onSave(album.id);
        setCreating(false);
        setNewName("");
      }
    } else if (selectedAlbumId) {
      onSave(selectedAlbumId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Bookmark</h3>
        <p className="text-xs text-gray-500 mb-4 truncate" title={filePath}>{fileName}</p>

        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => { setSelectedAlbumId(album.id); setCreating(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded border ${
                selectedAlbumId === album.id && !creating
                  ? "bg-white/10 border-white/30"
                  : "border-gray-800 hover:bg-gray-800"
              }`}
            >
              <Folder className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-200 truncate">{album.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setCreating(!creating)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-200 border border-dashed border-gray-700 rounded mb-4"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Cancel" : "Create new album"}
        </button>

        {creating && (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 mb-4 focus:outline-none focus:border-gray-600"
            placeholder="Album name"
            autoFocus
          />
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!selectedAlbumId && !creating) || (creating && !newName) || loading}
            className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
