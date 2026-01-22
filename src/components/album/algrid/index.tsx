"use client";

import React, { useState, useRef, useEffect } from "react";
import { Folder, File, Pencil, Trash2, FolderPlus, Users } from "lucide-react";
import type { AlbumItem, AlbumGroup } from "@/types/album";

interface AlbumItemCardProps {
  item: AlbumItem;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDoubleClick: (item: AlbumItem) => void;
  onContextMenu: (e: React.MouseEvent, item: AlbumItem) => void;
  onDragStart: (e: React.DragEvent, item: AlbumItem) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

export const AlbumItemCard: React.FC<AlbumItemCardProps> = ({
  item, selected, onSelect, onDoubleClick, onContextMenu, onDragStart, onDragOver, onDrop,
}) => {
  return (
    <div
      draggable
      onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => onDoubleClick(item)}
      onContextMenu={(e) => onContextMenu(e, item)}
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      className={`flex items-center gap-2 px-3 py-2 border cursor-pointer select-none ${
        selected ? "bg-white/10 border-white/30" : "border-gray-800 hover:bg-gray-900"
      }`}
    >
      {item.type === "dir" ? (
        <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
      ) : (
        <File className="h-4 w-4 text-gray-400 shrink-0" />
      )}
      <span className="truncate text-sm text-gray-200">{item.name}</span>
    </div>
  );
};

interface AlbumGroupCardProps {
  group: AlbumGroup;
  items: AlbumItem[];
  selectedIds: Set<string>;
  onSelectItem: (id: string, multi: boolean) => void;
  onItemDoubleClick: (item: AlbumItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: AlbumItem) => void;
  onGroupContextMenu: (e: React.MouseEvent, group: AlbumGroup) => void;
  onDragStart: (e: React.DragEvent, item: AlbumItem) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropToGroup: (e: React.DragEvent, groupId: string) => void;
  onDropToItem: (e: React.DragEvent, targetId: string) => void;
}

export const AlbumGroupCard: React.FC<AlbumGroupCardProps> = ({
  group, items, selectedIds, onSelectItem, onItemDoubleClick, onItemContextMenu,
  onGroupContextMenu, onDragStart, onDragOver, onDropToGroup, onDropToItem,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="border border-gray-700 bg-gray-900/50"
      onDragOver={onDragOver}
      onDrop={(e) => onDropToGroup(e, group.id)}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-800 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
        onContextMenu={(e) => onGroupContextMenu(e, group)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-300">{group.name}</span>
          <span className="text-xs text-gray-500">({items.length})</span>
        </div>
      </div>
      {!collapsed && (
        <div className="p-2 space-y-1">
          {items.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-2">Drag items here</p>
          ) : (
            items.map((item) => (
              <AlbumItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelect={onSelectItem}
                onDoubleClick={onItemDoubleClick}
                onContextMenu={onItemContextMenu}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDropToItem}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface ItemContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
  onEditNote: () => void;
}

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({
  x, y, onClose, onCopy, onCut, onDelete, onEditNote,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[140px]" style={{ left: x, top: y }}>
      <button onClick={onCopy} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700">Copy</button>
      <button onClick={onCut} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700">Cut</button>
      <div className="border-t border-gray-700 my-1" />
      <button onClick={onEditNote} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
        <Pencil className="h-3 w-3" /> Note
      </button>
      <div className="border-t border-gray-700 my-1" />
      <button onClick={onDelete} className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
        <Trash2 className="h-3 w-3" /> Delete
      </button>
    </div>
  );
};

interface GroupContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onEditNote: () => void;
  onDelete: () => void;
}

export const GroupContextMenu: React.FC<GroupContextMenuProps> = ({
  x, y, onClose, onRename, onEditNote, onDelete,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[140px]" style={{ left: x, top: y }}>
      <button onClick={onRename} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700">Rename</button>
      <button onClick={onEditNote} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
        <Pencil className="h-3 w-3" /> Note
      </button>
      <div className="border-t border-gray-700 my-1" />
      <button onClick={onDelete} className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
        <Trash2 className="h-3 w-3" /> Delete
      </button>
    </div>
  );
};

interface NoteEditorProps {
  value: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ value, onSave, onCancel }) => {
  const [text, setText] = useState(value);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-md">
        <h3 className="text-sm font-medium text-gray-200 mb-3">Edit Note</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:border-gray-600"
          placeholder="Write your note..."
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={() => onSave(text)} className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-gray-200">Save</button>
        </div>
      </div>
    </div>
  );
};

interface CreateGroupModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
          <FolderPlus className="h-4 w-4" /> Create Group
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          placeholder="Group name"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={() => name && onConfirm(name)} disabled={!name} className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
};
