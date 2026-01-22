"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import type { Album, AlbumItem, AlbumGroup, AlbumViewMode, BookmarkModalState } from "@/types/album";

interface AlbumState {
  albums: Album[];
  selectedAlbumId: string | null;
  viewMode: AlbumViewMode;
  loading: boolean;
  error: string | null;
  bookmarkModal: BookmarkModalState;
  clipboard: { items: AlbumItem[]; action: "copy" | "cut" } | null;
}

type AlbumAction =
  | { type: "SET_ALBUMS"; payload: Album[] }
  | { type: "ADD_ALBUM"; payload: Album }
  | { type: "UPDATE_ALBUM"; payload: Album }
  | { type: "DELETE_ALBUM"; payload: string }
  | { type: "SELECT_ALBUM"; payload: string | null }
  | { type: "SET_VIEW_MODE"; payload: AlbumViewMode }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "OPEN_BOOKMARK_MODAL"; payload: Omit<BookmarkModalState, "isOpen"> }
  | { type: "CLOSE_BOOKMARK_MODAL" }
  | { type: "SET_CLIPBOARD"; payload: { items: AlbumItem[]; action: "copy" | "cut" } | null }
  | { type: "UPDATE_ITEM"; payload: { albumId: string; item: AlbumItem } }
  | { type: "DELETE_ITEM"; payload: { albumId: string; itemId: string } }
  | { type: "REORDER_ITEM"; payload: { albumId: string; draggedId: string; targetId: string } }
  | { type: "ADD_GROUP"; payload: { albumId: string; group: AlbumGroup; itemIds?: string[] } }
  | { type: "UPDATE_GROUP"; payload: { albumId: string; group: AlbumGroup } }
  | { type: "DELETE_GROUP"; payload: { albumId: string; groupId: string } };

const initialState: AlbumState = {
  albums: [],
  selectedAlbumId: null,
  viewMode: "albums",
  loading: false,
  error: null,
  bookmarkModal: { isOpen: false, filePath: "", fileName: "", fileType: "file" },
  clipboard: null,
};

function albumReducer(state: AlbumState, action: AlbumAction): AlbumState {
  switch (action.type) {
    case "SET_ALBUMS":
      return { ...state, albums: action.payload };
    case "ADD_ALBUM":
      return { ...state, albums: [...state.albums, action.payload] };
    case "UPDATE_ALBUM":
      return {
        ...state,
        albums: state.albums.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };
    case "DELETE_ALBUM":
      return {
        ...state,
        albums: state.albums.filter((a) => a.id !== action.payload),
        selectedAlbumId: state.selectedAlbumId === action.payload ? null : state.selectedAlbumId,
        viewMode: state.selectedAlbumId === action.payload ? "albums" : state.viewMode,
      };
    case "SELECT_ALBUM":
      return { ...state, selectedAlbumId: action.payload, viewMode: action.payload ? "album-detail" : "albums" };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "OPEN_BOOKMARK_MODAL":
      return { ...state, bookmarkModal: { ...action.payload, isOpen: true } };
    case "CLOSE_BOOKMARK_MODAL":
      return { ...state, bookmarkModal: { ...state.bookmarkModal, isOpen: false } };
    case "SET_CLIPBOARD":
      return { ...state, clipboard: action.payload };
    case "UPDATE_ITEM": {
      const albums = state.albums.map((album) => {
        if (album.id !== action.payload.albumId) return album;
        return {
          ...album,
          items: album.items.map((i) => (i.id === action.payload.item.id ? action.payload.item : i)),
        };
      });
      return { ...state, albums };
    }
    case "DELETE_ITEM": {
      const albums = state.albums.map((album) => {
        if (album.id !== action.payload.albumId) return album;
        return { ...album, items: album.items.filter((i) => i.id !== action.payload.itemId) };
      });
      return { ...state, albums };
    }
    case "REORDER_ITEM": {
      const { albumId, draggedId, targetId } = action.payload;
      const albums = state.albums.map((album) => {
        if (album.id !== albumId) return album;
        const items = [...album.items];
        const draggedIdx = items.findIndex((i) => i.id === draggedId);
        const targetIdx = items.findIndex((i) => i.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return album;
        const [dragged] = items.splice(draggedIdx, 1);
        items.splice(targetIdx, 0, dragged);
        return { ...album, items };
      });
      return { ...state, albums };
    }
    case "ADD_GROUP": {
      const { albumId, group, itemIds } = action.payload;
      const albums = state.albums.map((album) => {
        if (album.id !== albumId) return album;
        // Update items to set groupId if itemIds provided
        const updatedItems = itemIds?.length 
          ? album.items.map(item => 
              itemIds.includes(item.id) ? { ...item, groupId: group.id } : item
            )
          : album.items;
        return { ...album, groups: [...album.groups, group], items: updatedItems };
      });
      return { ...state, albums };
    }
    case "UPDATE_GROUP": {
      const albums = state.albums.map((album) => {
        if (album.id !== action.payload.albumId) return album;
        return {
          ...album,
          groups: album.groups.map((g) => (g.id === action.payload.group.id ? action.payload.group : g)),
        };
      });
      return { ...state, albums };
    }
    case "DELETE_GROUP": {
      const albums = state.albums.map((album) => {
        if (album.id !== action.payload.albumId) return album;
        return { ...album, groups: album.groups.filter((g) => g.id !== action.payload.groupId) };
      });
      return { ...state, albums };
    }
    default:
      return state;
  }
}

interface AlbumContextValue {
  state: AlbumState;
  fetchAlbums: (repoOwner: string, repoName: string) => Promise<void>;
  createAlbum: (name: string, repoOwner: string, repoName: string) => Promise<Album | null>;
  updateAlbum: (albumId: string, data: { name?: string; note?: string; order?: number }) => Promise<void>;
  deleteAlbum: (albumId: string) => Promise<void>;
  selectAlbum: (albumId: string | null) => void;
  openBookmarkModal: (filePath: string, fileName: string, fileType: "file" | "dir") => void;
  closeBookmarkModal: () => void;
  addBookmark: (albumId: string, path: string, name: string, type: "file" | "dir") => Promise<void>;
  updateItem: (itemId: string, data: { note?: string; order?: number; groupId?: string | null }) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  reorderItem: (albumId: string, draggedId: string, targetId: string) => void;
  createGroup: (albumId: string, name: string, itemIds?: string[]) => Promise<void>;
  updateGroup: (groupId: string, data: { name?: string; note?: string; order?: number }) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  setClipboard: (items: AlbumItem[], action: "copy" | "cut") => void;
  pasteItems: (albumId: string) => Promise<void>;
  getBookmarkedPaths: (albumId?: string) => Set<string>;
}

const AlbumContext = createContext<AlbumContextValue | null>(null);

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(albumReducer, initialState);

  const fetchAlbums = useCallback(async (repoOwner: string, repoName: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await fetch(`/api/album?repoOwner=${repoOwner}&repoName=${repoName}`);
      const json = await res.json();
      if (json.success) dispatch({ type: "SET_ALBUMS", payload: json.data });
      else dispatch({ type: "SET_ERROR", payload: json.error });
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch albums" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createAlbum = useCallback(async (name: string, repoOwner: string, repoName: string) => {
    try {
      const res = await fetch("/api/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, repoOwner, repoName }),
      });
      const json = await res.json();
      if (json.success) {
        dispatch({ type: "ADD_ALBUM", payload: json.data });
        return json.data as Album;
      }
    } catch {}
    return null;
  }, []);

  const updateAlbum = useCallback(async (albumId: string, data: { name?: string; note?: string; order?: number }) => {
    const res = await fetch("/api/album", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, ...data }),
    });
    const json = await res.json();
    if (json.success) dispatch({ type: "UPDATE_ALBUM", payload: json.data });
  }, []);

  const deleteAlbum = useCallback(async (albumId: string) => {
    const res = await fetch(`/api/album?albumId=${albumId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) dispatch({ type: "DELETE_ALBUM", payload: albumId });
  }, []);

  const selectAlbum = useCallback((albumId: string | null) => {
    dispatch({ type: "SELECT_ALBUM", payload: albumId });
  }, []);

  const openBookmarkModal = useCallback((filePath: string, fileName: string, fileType: "file" | "dir") => {
    dispatch({ type: "OPEN_BOOKMARK_MODAL", payload: { filePath, fileName, fileType } });
  }, []);

  const closeBookmarkModal = useCallback(() => {
    dispatch({ type: "CLOSE_BOOKMARK_MODAL" });
  }, []);

  const addBookmark = useCallback(async (albumId: string, path: string, name: string, type: "file" | "dir") => {
    const res = await fetch("/api/album/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, path, name, type }),
    });
    const json = await res.json();
    if (json.success) {
      // Refetch to get updated album
      const album = state.albums.find((a) => a.id === albumId);
      if (album) {
        const updated = { ...album, items: [...album.items, json.data] };
        dispatch({ type: "UPDATE_ALBUM", payload: updated });
      }
    }
  }, [state.albums]);

  const updateItem = useCallback(async (itemId: string, data: { note?: string; order?: number; groupId?: string | null }) => {
    const res = await fetch("/api/album/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...data }),
    });
    const json = await res.json();
    if (json.success) {
      const album = state.albums.find((a) => a.items.some((i) => i.id === itemId));
      if (album) dispatch({ type: "UPDATE_ITEM", payload: { albumId: album.id, item: json.data } });
    }
  }, [state.albums]);

  const deleteItem = useCallback(async (itemId: string) => {
    const res = await fetch(`/api/album/item?itemId=${itemId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      const album = state.albums.find((a) => a.items.some((i) => i.id === itemId));
      if (album) dispatch({ type: "DELETE_ITEM", payload: { albumId: album.id, itemId } });
    }
  }, [state.albums]);

  // Instant reorder for drag-drop (optimistic update)
  const reorderItem = useCallback((albumId: string, draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    // Optimistic update - instant UI change
    dispatch({ type: "REORDER_ITEM", payload: { albumId, draggedId, targetId } });
    // Persist to backend (fire and forget)
    const album = state.albums.find(a => a.id === albumId);
    if (album) {
      const items = [...album.items];
      const targetIdx = items.findIndex(i => i.id === targetId);
      if (targetIdx !== -1) {
        fetch("/api/album/item", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: draggedId, order: targetIdx }),
        });
      }
    }
  }, [state.albums]);

  const createGroup = useCallback(async (albumId: string, name: string, itemIds?: string[]) => {
    const res = await fetch("/api/album/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, name, itemIds }),
    });
    const json = await res.json();
    if (json.success) dispatch({ type: "ADD_GROUP", payload: { albumId, group: json.data, itemIds } });
  }, []);

  const updateGroup = useCallback(async (groupId: string, data: { name?: string; note?: string; order?: number }) => {
    const res = await fetch("/api/album/group", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, ...data }),
    });
    const json = await res.json();
    if (json.success) {
      const album = state.albums.find((a) => a.groups.some((g) => g.id === groupId));
      if (album) dispatch({ type: "UPDATE_GROUP", payload: { albumId: album.id, group: json.data } });
    }
  }, [state.albums]);

  const deleteGroup = useCallback(async (groupId: string) => {
    const res = await fetch(`/api/album/group?groupId=${groupId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      const album = state.albums.find((a) => a.groups.some((g) => g.id === groupId));
      if (album) dispatch({ type: "DELETE_GROUP", payload: { albumId: album.id, groupId } });
    }
  }, [state.albums]);

  const setClipboard = useCallback((items: AlbumItem[], action: "copy" | "cut") => {
    dispatch({ type: "SET_CLIPBOARD", payload: { items, action } });
  }, []);

  const pasteItems = useCallback(async (albumId: string) => {
    if (!state.clipboard) return;
    for (const item of state.clipboard.items) {
      await addBookmark(albumId, item.path, item.name, item.type as "file" | "dir");
    }
    if (state.clipboard.action === "cut") {
      for (const item of state.clipboard.items) await deleteItem(item.id);
    }
    dispatch({ type: "SET_CLIPBOARD", payload: null });
  }, [state.clipboard, addBookmark, deleteItem]);

  const getBookmarkedPaths = useCallback((albumId?: string) => {
    const paths = new Set<string>();
    const albumsToCheck = albumId 
      ? state.albums.filter(a => a.id === albumId)
      : state.albums;
    for (const album of albumsToCheck) {
      for (const item of album.items) paths.add(item.path);
    }
    return paths;
  }, [state.albums]);

  return (
    <AlbumContext.Provider
      value={{
        state, fetchAlbums, createAlbum, updateAlbum, deleteAlbum, selectAlbum,
        openBookmarkModal, closeBookmarkModal, addBookmark, updateItem, deleteItem, reorderItem,
        createGroup, updateGroup, deleteGroup, setClipboard, pasteItems, getBookmarkedPaths,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error("useAlbum must be used within AlbumProvider");
  return ctx;
}
