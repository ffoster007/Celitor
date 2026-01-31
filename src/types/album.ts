// Album System Types

export interface AlbumItem {
  id: string;
  path: string;
  name: string;
  type: "file" | "dir";
  note: string | null;
  order: number;
  albumId: string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumGroup {
  id: string;
  name: string;
  note: string | null;
  order: number;
  albumId: string;
  items: AlbumItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  name: string;
  repoOwner: string;
  repoName: string;
  note: string | null;
  order: number;
  userId: string;
  items: AlbumItem[];
  groups: AlbumGroup[];
  createdAt: string;
  updatedAt: string;
  // Shared album fields
  sourceRepoOwner: string | null;
  sourceRepoName: string | null;
  sourceAlbumId: string | null;
  isShared: boolean;
  lastSyncedAt: string | null;
  // Virtual field - album from source repo (not synced yet)
  isFromSourceRepo?: boolean;
  // Creator info (for source repo albums)
  user?: {
    name: string | null;
    image: string | null;
  };
}

// API Request/Response types
export interface CreateAlbumRequest {
  name: string;
  repoOwner: string;
  repoName: string;
}

export interface UpdateAlbumRequest {
  name?: string;
  note?: string;
  order?: number;
}

export interface AddBookmarkRequest {
  albumId: string;
  path: string;
  name: string;
  type: "file" | "dir";
}

export interface UpdateItemRequest {
  note?: string;
  order?: number;
  groupId?: string | null;
}

export interface CreateGroupRequest {
  albumId: string;
  name: string;
  itemIds?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  note?: string;
  order?: number;
}

// Context Menu state
export interface BookmarkModalState {
  isOpen: boolean;
  filePath: string;
  fileName: string;
  fileType: "file" | "dir";
}

// Album view state
export type AlbumViewMode = "albums" | "album-detail";

export interface AlbumState {
  albums: Album[];
  selectedAlbumId: string | null;
  viewMode: AlbumViewMode;
  loading: boolean;
  error: string | null;
}

// Fork sync info
export interface ForkSyncInfo {
  isFork: boolean;
  parentRepo?: {
    owner: string;
    name: string;
  };
  sourceRepo?: {
    owner: string;
    name: string;
  };
  availableAlbums: number;
  syncedAlbums: number;
  canSync: boolean;
}

// Drag and drop
export interface DragItem {
  id: string;
  type: "item" | "group";
  index: number;
}
