"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { useAlbum } from "./album-context";
import { AlbumList, AlbumHeader, CreateAlbumModal, RenameModal } from "./algrid/album-ui";
import { AlbumItemCard, AlbumGroupCard, ItemContextMenu, GroupContextMenu, NoteEditor, CreateGroupModal } from "./algrid";
import type { Album, AlbumItem, AlbumGroup } from "@/types/album";

interface AlbumPageProps {
  repoOwner: string;
  repoName: string;
  onItemClick?: (path: string, type: "file" | "dir") => void;
}

const AlbumPage: React.FC<AlbumPageProps> = ({ repoOwner, repoName, onItemClick }) => {
  const { state, fetchAlbums, createAlbum, updateAlbum, deleteAlbum, selectAlbum, updateItem, deleteItem, reorderItem, createGroup, updateGroup, deleteGroup, setClipboard, pasteItems } = useAlbum();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Album | null>(null);
  const [renameGroupTarget, setRenameGroupTarget] = useState<AlbumGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemMenu, setItemMenu] = useState<{ x: number; y: number; item: AlbumItem } | null>(null);
  const [groupMenu, setGroupMenu] = useState<{ x: number; y: number; group: AlbumGroup } | null>(null);
  const [noteEditor, setNoteEditor] = useState<{ type: "album" | "item" | "group"; id: string; value: string } | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchAlbums(repoOwner, repoName);
  }, [fetchAlbums, repoOwner, repoName]);

  const selectedAlbum = state.albums.find((a) => a.id === state.selectedAlbumId);
  const ungroupedItems = selectedAlbum?.items.filter((i) => !i.groupId) ?? [];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedAlbum || selectedIds.size === 0) return;
      const items = selectedAlbum.items.filter((i) => selectedIds.has(i.id));
      if ((e.ctrlKey || e.metaKey) && e.key === "c") { e.preventDefault(); setClipboard(items, "copy"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "x") { e.preventDefault(); setClipboard(items, "cut"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && state.clipboard) { e.preventDefault(); pasteItems(selectedAlbum.id); }
      if (e.key === "Delete") { e.preventDefault(); items.forEach((i) => deleteItem(i.id)); setSelectedIds(new Set()); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedAlbum, selectedIds, state.clipboard, setClipboard, pasteItems, deleteItem]);

  // Ctrl+Right click to create group - use capture phase to intercept before InteractionGuard
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.ctrlKey && e.button === 2 && selectedIds.size > 0 && selectedAlbum) {
        e.preventDefault();
        e.stopPropagation();
        setShowCreateGroup(true);
      }
    };
    document.addEventListener("contextmenu", handler, true); // capture phase
    return () => document.removeEventListener("contextmenu", handler, true);
  }, [selectedIds, selectedAlbum]);

  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleItemDoubleClick = useCallback((item: AlbumItem) => {
    onItemClick?.(item.path, item.type as "file" | "dir");
  }, [onItemClick]);

  const handleDragStart = useCallback((e: React.DragEvent, item: AlbumItem) => {
    e.dataTransfer.setData("text/plain", item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropToItem = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId || !state.selectedAlbumId) return;
    // Instant reorder with optimistic update
    reorderItem(state.selectedAlbumId, draggedId, targetId);
  }, [state.selectedAlbumId, reorderItem]);

  const handleDropToGroup = useCallback(async (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId) await updateItem(draggedId, { groupId });
  }, [updateItem]);

  if (state.loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>;
  }

  // Album list view
  if (!selectedAlbum) {
    return (
      <div className="flex flex-col h-full bg-black text-white">
        <AlbumList
          albums={state.albums}
          onSelect={(a) => selectAlbum(a.id)}
          onCreate={() => setShowCreateModal(true)}
          onRename={(a) => setRenameTarget(a)}
          onDelete={(a) => deleteAlbum(a.id)}
        />
        {showCreateModal && (
          <CreateAlbumModal
            onConfirm={async (name) => { await createAlbum(name, repoOwner, repoName); setShowCreateModal(false); }}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
        {renameTarget && (
          <RenameModal
            currentName={renameTarget.name}
            onConfirm={async (name) => { await updateAlbum(renameTarget.id, { name }); setRenameTarget(null); }}
            onCancel={() => setRenameTarget(null)}
          />
        )}
      </div>
    );
  }

  // Album detail view
  return (
    <div className="flex flex-col h-full bg-black text-white">
      <AlbumHeader
        name={selectedAlbum.name}
        onBack={() => selectAlbum(null)}
        hasClipboard={!!state.clipboard}
        onPaste={() => pasteItems(selectedAlbum.id)}
      />

      {/* Main content - split into items and note sections */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable items area - max 50% height */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[50%]">
          {/* Groups */}
          {selectedAlbum.groups.map((group) => (
            <AlbumGroupCard
              key={group.id}
              group={group}
              items={selectedAlbum.items.filter((i) => i.groupId === group.id)}
              selectedIds={selectedIds}
              onSelectItem={handleSelect}
              onItemDoubleClick={handleItemDoubleClick}
              onItemContextMenu={(e, item) => { e.preventDefault(); setItemMenu({ x: e.clientX, y: e.clientY, item }); }}
              onGroupContextMenu={(e, g) => { e.preventDefault(); setGroupMenu({ x: e.clientX, y: e.clientY, group: g }); }}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDropToGroup={handleDropToGroup}
              onDropToItem={handleDropToItem}
            />
          ))}

          {/* Ungrouped items */}
          <div className="space-y-1">
            {ungroupedItems.map((item) => (
              <AlbumItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelect={handleSelect}
                onDoubleClick={handleItemDoubleClick}
                onContextMenu={(e, i) => { e.preventDefault(); setItemMenu({ x: e.clientX, y: e.clientY, item: i }); }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDropToItem}
              />
            ))}
          </div>

          {ungroupedItems.length === 0 && selectedAlbum.groups.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No bookmarks yet</p>
          )}
        </div>

        {/* Album Note - fixed at bottom, takes remaining space up to 50% */}
        <div className="flex-1 min-h-[100px] max-h-[50%] border-t border-gray-800 px-4 py-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Note</span>
            <button onClick={() => setNoteEditor({ type: "album", id: selectedAlbum.id, value: selectedAlbum.note ?? "" })} className="p-1 hover:bg-gray-800 rounded">
              <Pencil className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs text-gray-400 whitespace-pre-wrap">{selectedAlbum.note || "No note"}</p>
          </div>
        </div>
      </div>

      {/* Context menus */}
      {itemMenu && (
        <ItemContextMenu
          x={itemMenu.x}
          y={itemMenu.y}
          onClose={() => setItemMenu(null)}
          onCopy={() => { setClipboard([itemMenu.item], "copy"); setItemMenu(null); }}
          onCut={() => { setClipboard([itemMenu.item], "cut"); setItemMenu(null); }}
          onDelete={() => { deleteItem(itemMenu.item.id); setItemMenu(null); }}
          onEditNote={() => { setNoteEditor({ type: "item", id: itemMenu.item.id, value: itemMenu.item.note ?? "" }); setItemMenu(null); }}
        />
      )}
      {groupMenu && (
        <GroupContextMenu
          x={groupMenu.x}
          y={groupMenu.y}
          onClose={() => setGroupMenu(null)}
          onRename={() => { setRenameGroupTarget(groupMenu.group); setGroupMenu(null); }}
          onEditNote={() => { setNoteEditor({ type: "group", id: groupMenu.group.id, value: groupMenu.group.note ?? "" }); setGroupMenu(null); }}
          onDelete={() => { deleteGroup(groupMenu.group.id); setGroupMenu(null); }}
        />
      )}
      {noteEditor && (
        <NoteEditor
          value={noteEditor.value}
          onSave={async (note) => {
            if (noteEditor.type === "album") await updateAlbum(noteEditor.id, { note });
            else if (noteEditor.type === "item") await updateItem(noteEditor.id, { note });
            else if (noteEditor.type === "group") await updateGroup(noteEditor.id, { note });
            setNoteEditor(null);
          }}
          onCancel={() => setNoteEditor(null)}
        />
      )}
      {showCreateGroup && (
        <CreateGroupModal
          onConfirm={async (name) => {
            await createGroup(selectedAlbum.id, name, Array.from(selectedIds));
            setShowCreateGroup(false);
            setSelectedIds(new Set());
          }}
          onCancel={() => setShowCreateGroup(false)}
        />
      )}
      {renameGroupTarget && (
        <RenameModal
          currentName={renameGroupTarget.name}
          onConfirm={async (name) => { await updateGroup(renameGroupTarget.id, { name }); setRenameGroupTarget(null); }}
          onCancel={() => setRenameGroupTarget(null)}
        />
      )}
    </div>
  );
};

export default AlbumPage;
