"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Album as AlbumIcon, MoreVertical, Pencil, Trash2, ArrowLeft } from "lucide-react";
import type { Album } from "@/types/album";

interface AlbumListProps {
  albums: Album[];
  onSelect: (album: Album) => void;
  onCreate: () => void;
  onRename: (album: Album) => void;
  onDelete: (album: Album) => void;
}

export const AlbumList: React.FC<AlbumListProps> = ({ albums, onSelect, onCreate, onRename, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Albums</h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white text-black hover:bg-gray-200 cursor-pointer">
          <Plus className="h-3 w-3" /> New Album
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {albums.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">No albums yet</p>
        ) : (
          <div className="space-y-1">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group flex items-center justify-between px-3 py-2 border border-gray-800 hover:bg-gray-900 cursor-pointer"
                onClick={() => onSelect(album)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlbumIcon className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="truncate text-sm text-gray-200">{album.name}</span>
                  <span className="text-xs text-gray-600">({album.items.length})</span>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === album.id ? null : album.id); }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                  {menuOpen === album.id && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[120px] z-10">
                      <button onClick={(e) => { e.stopPropagation(); onRename(album); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                        <Pencil className="h-3 w-3" /> Rename
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(album); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface AlbumHeaderProps {
  name: string;
  onBack: () => void;
  onPaste?: () => void;
  hasClipboard: boolean;
}

export const AlbumHeader: React.FC<AlbumHeaderProps> = ({ name, onBack, onPaste, hasClipboard }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
    <div className="flex items-center gap-2">
      <button onClick={onBack} className="p-1 hover:bg-gray-800 rounded cursor-pointer">
        <ArrowLeft className="h-4 w-4 text-gray-400" />
      </button>
      <h2 className="text-sm font-semibold text-gray-200">{name}</h2>
    </div>
    {hasClipboard && onPaste && (
      <button onClick={onPaste} className="text-xs text-gray-400 hover:text-gray-200">Paste</button>
    )}
  </div>
);

interface CreateAlbumModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-3">Create Album</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          placeholder="Album name"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && name && onConfirm(name)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 cursor-pointer">Cancel</button>
          <button onClick={() => name && onConfirm(name)} disabled={!name} className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 cursor-pointer">Create</button>
        </div>
      </div>
    </div>
  );
};

interface RenameModalProps {
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ currentName, onConfirm, onCancel }) => {
  const [name, setName] = useState(currentName);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-3">Rename</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && name && onConfirm(name)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={() => name && onConfirm(name)} disabled={!name} className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
};
