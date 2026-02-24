"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Album as AlbumIcon, MoreVertical, Pencil, Trash2, ArrowLeft, RefreshCw, GitFork, ExternalLink } from "lucide-react";
import type { Album, ForkSyncInfo } from "@/types/album";

interface AlbumListProps {
  albums: Album[];
  onSelect: (album: Album) => void;
  onCreate: () => void;
  onRename: (album: Album) => void;
  onDelete: (album: Album) => void;
  forkSyncInfo?: ForkSyncInfo | null;
  onSync?: () => void;
  syncLoading?: boolean;
}

export const AlbumList: React.FC<AlbumListProps> = ({ 
  albums, onSelect, onCreate, onRename, onDelete,
  forkSyncInfo, onSync, syncLoading 
}) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Separate albums into categories:
  // 1. Source repo albums (from parent repo, not synced yet) - isFromSourceRepo = true
  // 2. Synced albums (user has synced from parent) - isShared = true
  // 3. User's own albums - not shared and not from source
  const sourceRepoAlbums = albums.filter(a => a.isFromSourceRepo);
  const syncedAlbums = albums.filter(a => a.isShared && !a.isFromSourceRepo);
  const ownAlbums = albums.filter(a => !a.isShared && !a.isFromSourceRepo);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white">
        <h2 className="text-sm font-semibold text-gray-200">Albums</h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white text-black hover:bg-gray-200 cursor-pointer">
          <Plus className="h-3 w-3" /> New Album
        </button>
      </div>

      {/* Fork Info Banner - show when there are source repo albums */}
      {sourceRepoAlbums.length > 0 && (
        <div className="mx-3 mt-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-300 text-xs">
            <GitFork className="h-3.5 w-3.5" />
            <span>
              {sourceRepoAlbums.length} album{sourceRepoAlbums.length !== 1 ? 's' : ''} from parent repository
            </span>
          </div>
        </div>
      )}

      {/* Legacy Fork Sync Banner - for manual sync (can be removed if auto-fetch is preferred) */}
      {forkSyncInfo?.isFork && forkSyncInfo.canSync && sourceRepoAlbums.length === 0 && (
        <div className="mx-3 mt-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-300 text-xs mb-2">
            <GitFork className="h-3.5 w-3.5" />
            <span>
              Forked from {forkSyncInfo.sourceRepo?.owner}/{forkSyncInfo.sourceRepo?.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {forkSyncInfo.availableAlbums} album{forkSyncInfo.availableAlbums !== 1 ? 's' : ''} available
              {forkSyncInfo.syncedAlbums > 0 && ` (${forkSyncInfo.syncedAlbums} synced)`}
            </span>
            <button
              onClick={onSync}
              disabled={syncLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-600 text-white hover:bg-blue-500 rounded disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Syncing...' : 'Sync Albums'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {albums.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">No albums yet</p>
        ) : (
          <div className="space-y-1">
            {/* Source repo albums (from parent, read-only view) */}
            {sourceRepoAlbums.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 uppercase tracking-wide">
                  <GitFork className="h-3 w-3" />
                  <span>From Parent Repository</span>
                </div>
                {sourceRepoAlbums.map((album) => (
                  <AlbumListItem
                    key={album.id}
                    album={album}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    menuRef={menuRef}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete}
                    isFromSourceRepo
                  />
                ))}
              </>
            )}

            {/* Synced albums (user has synced from parent) */}
            {syncedAlbums.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 uppercase tracking-wide mt-3">
                  <RefreshCw className="h-3 w-3" />
                  <span>Synced Albums</span>
                </div>
                {syncedAlbums.map((album) => (
                  <AlbumListItem
                    key={album.id}
                    album={album}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    menuRef={menuRef}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete}
                    isShared
                  />
                ))}
              </>
            )}

            {/* Own albums */}
            {ownAlbums.length > 0 && (sourceRepoAlbums.length > 0 || syncedAlbums.length > 0) && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 uppercase tracking-wide mt-3">
                <AlbumIcon className="h-3 w-3" />
                <span>My Albums</span>
              </div>
            )}
            {ownAlbums.map((album) => (
              <AlbumListItem
                key={album.id}
                album={album}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                menuRef={menuRef}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted album list item component
interface AlbumListItemProps {
  album: Album;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (album: Album) => void;
  onRename: (album: Album) => void;
  onDelete: (album: Album) => void;
  isShared?: boolean;
  isFromSourceRepo?: boolean;
}

const AlbumListItem: React.FC<AlbumListItemProps> = ({
  album, menuOpen, setMenuOpen, menuRef, onSelect, onRename, onDelete, isShared, isFromSourceRepo
}) => {
  const isRemote = isShared || isFromSourceRepo;
  
  const handleExport = async (a: Album) => {
    try {
      const res = await fetch('/api/album/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: a.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        console.error('Export failed', json);
        alert('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = `${a.name || a.id}.zip`;
      document.body.appendChild(aEl);
      aEl.click();
      aEl.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };
  
  return (
    <div
        className={`group flex items-center justify-between px-3 py-2 border hover:bg-gray-900 cursor-pointer ${
          isFromSourceRepo ? 'border-blue-800/50 bg-blue-950/20' : 'border-white'
        }`}
      onClick={() => onSelect(album)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isRemote ? (
          <GitFork className="h-4 w-4 text-blue-400 shrink-0" />
        ) : (
          <AlbumIcon className="h-4 w-4 text-gray-500 shrink-0" />
        )}
        <span className="truncate text-sm text-gray-200">{album.name}</span>
        <span className="text-xs text-gray-600">({album.items.length})</span>
        {isFromSourceRepo && (
          <span className="px-1.5 py-0.5 text-[10px] bg-purple-900/50 text-purple-300 rounded">parent</span>
        )}
        {isShared && !isFromSourceRepo && (
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-900/50 text-blue-300 rounded">synced</span>
        )}
        {/* Show creator name for source repo albums */}
        {isFromSourceRepo && album.user?.name && (
          <span className="text-xs text-gray-500">by {album.user.name}</span>
        )}
      </div>
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === album.id ? null : album.id); }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded"
        >
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
        {menuOpen === album.id && (
           <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-gray-800 border border-white rounded shadow-lg py-1 min-w-[120px] z-10">
            {/* View source link for remote albums */}
            {isFromSourceRepo && album.sourceRepoOwner && album.sourceRepoName && (
              <a
                href={`https://github.com/${album.sourceRepoOwner}/${album.sourceRepoName}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" /> View Source Repo
              </a>
            )}
            {isShared && !isFromSourceRepo && album.sourceRepoOwner && album.sourceRepoName && (
              <a
                href={`https://github.com/${album.sourceRepoOwner}/${album.sourceRepoName}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" /> View Source
              </a>
            )}
            {/* Only allow rename/delete for user's own albums or synced copies */}
            {!isFromSourceRepo && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleExport(album); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="h-3 w-3" /> Export
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRename(album); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                  <Pencil className="h-3 w-3" /> Rename
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(album); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </>
            )}
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
  isShared?: boolean;
  isFromSourceRepo?: boolean;
  sourceRepo?: { owner: string; name: string } | null;
  lastSyncedAt?: string | null;
  creatorName?: string | null;
}

export const AlbumHeader: React.FC<AlbumHeaderProps> = ({ 
  name, onBack, onPaste, hasClipboard, isShared, isFromSourceRepo, sourceRepo, lastSyncedAt, creatorName
}) => {
  const isRemote = isShared || isFromSourceRepo;
  
  return (
    <div className="border-b border-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-gray-800 rounded cursor-pointer">
            <ArrowLeft className="h-4 w-4 text-gray-400" />
          </button>
          <h2 className="text-sm font-semibold text-gray-200">{name}</h2>
          {isFromSourceRepo && (
            <span className="px-1.5 py-0.5 text-[10px] bg-purple-900/50 text-purple-300 rounded flex items-center gap-1">
              <GitFork className="h-2.5 w-2.5" /> from parent
            </span>
          )}
          {isShared && !isFromSourceRepo && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-900/50 text-blue-300 rounded flex items-center gap-1">
              <GitFork className="h-2.5 w-2.5" /> synced
            </span>
          )}
        </div>
        {hasClipboard && onPaste && !isFromSourceRepo && (
          <button onClick={onPaste} className="text-xs text-gray-400 hover:text-gray-200">Paste</button>
        )}
      </div>
      {isRemote && sourceRepo && (
        <div className="px-4 pb-2 flex items-center gap-2 text-xs text-gray-500">
          <span>From:</span>
          <a
            href={`https://github.com/${sourceRepo.owner}/${sourceRepo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {sourceRepo.owner}/{sourceRepo.name}
            <ExternalLink className="h-3 w-3" />
          </a>
          {creatorName && (
            <span className="text-gray-600">• by {creatorName}</span>
          )}
          {lastSyncedAt && (
            <span className="text-gray-600">
              • Synced: {new Date(lastSyncedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateAlbumModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-white rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-3">Create Album</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-white rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white"
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
      <div className="bg-gray-900 border border-white rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-200 mb-3">Rename</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-white rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white"
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
