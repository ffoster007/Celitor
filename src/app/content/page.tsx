"use client";

import { useMemo, useRef, useState, useSyncExternalStore, useCallback, useEffect } from "react";
import ActivityBar from "@/components/activitybar/page";
import Toolbar from "@/components/toolbar/page";
import { FileExplorer, FileViewer, RepoSelector } from "@/components/explorer";
import { BridgeVisualization } from "@/components/bridge";
import { FileContextMenu } from "@/components/bridge/file-context-menu";
import UsageGuide from "@/components/content/usage-guide";
import { AlbumPage, AlbumProvider, useAlbum, BookmarkModal } from "@/components/album";
import type { GitHubRepo } from "@/lib/github";
import type { BridgeData, FileContextMenuState } from "@/types/bridge";

const SELECTED_REPO_STORAGE_KEY = "celitor_selected_repo";
const SELECTED_REPO_CHANGED_EVENT = "celitor:selected_repo_changed";

const subscribeToSelectedRepo = (onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
        if (event.key === SELECTED_REPO_STORAGE_KEY) onStoreChange();
    };
    const onCustom = () => onStoreChange();

    window.addEventListener("storage", onStorage);
    window.addEventListener(SELECTED_REPO_CHANGED_EVENT, onCustom);

    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(SELECTED_REPO_CHANGED_EVENT, onCustom);
    };
};

const getSelectedRepoSnapshot = () => {
    return localStorage.getItem(SELECTED_REPO_STORAGE_KEY);
};

const getSelectedRepoServerSnapshot = () => {
    return null;
};

const subscribeNoop = () => {
    return () => {};
};

const getHydratedSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

const isGitHubRepo = (value: unknown): value is GitHubRepo => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;

    const name = record.name;
    const fullName = record.full_name;
    const owner = record.owner;

    if (typeof name !== "string" || typeof fullName !== "string") return false;
    if (!owner || typeof owner !== "object") return false;
    const ownerRecord = owner as Record<string, unknown>;
    if (typeof ownerRecord.login !== "string") return false;

    return true;
};

const ContentPage = () => {
    const hydrated = useSyncExternalStore(
        subscribeNoop,
        getHydratedSnapshot,
        getHydratedServerSnapshot
    );

    const selectedRepoJson = useSyncExternalStore(
        subscribeToSelectedRepo,
        getSelectedRepoSnapshot,
        getSelectedRepoServerSnapshot
    );

    const selectedRepo = useMemo<GitHubRepo | null>(() => {
        if (!selectedRepoJson) return null;
        try {
            const parsed: unknown = JSON.parse(selectedRepoJson);
            return isGitHubRepo(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, [selectedRepoJson]);

    const [repoSelectorOpen, setRepoSelectorOpen] = useState(false);
    const [explorerOverride, setExplorerOverride] = useState<boolean | null>(null);
    const [albumActive, setAlbumActive] = useState(false);
    const [showAlbumView, setShowAlbumView] = useState(false);
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [panelWidth, setPanelWidth] = useState(256);
    const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

    // Bridge system state
    const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);
    const [bridgeLoading, setBridgeLoading] = useState(false);
    const [bridgeError, setBridgeError] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<FileContextMenuState>({
        isOpen: false,
        position: { x: 0, y: 0 },
        filePath: "",
        fileName: "",
    });

    const explorerVisible = selectedRepo ? (explorerOverride ?? true) : false;
    const showRepoSelector = hydrated && (repoSelectorOpen || !selectedRepo);

    const handleSelectRepo = (repo: GitHubRepo) => {
        setRepoSelectorOpen(false);
        setExplorerOverride(true);
        setActiveFilePath(null);
        setPanelWidth(256);
        // Save to localStorage
        localStorage.setItem(SELECTED_REPO_STORAGE_KEY, JSON.stringify(repo));
        window.dispatchEvent(new Event(SELECTED_REPO_CHANGED_EVENT));
    };

    const handleExplorerToggle = (isActive: boolean) => {
        if (isActive && !selectedRepo) {
            setRepoSelectorOpen(true);
        } else {
            setExplorerOverride(isActive);
            if (isActive) setAlbumActive(false);
        }
    };

    const handleAlbumToggle = (isActive: boolean) => {
        setAlbumActive(isActive);
        if (isActive) {
            // Toggle album view when clicking album button
            setShowAlbumView(prev => !prev);
        }
        // Don't close explorer when opening album - they can work together
    };

    const handleChangeRepo = () => {
        setActiveFilePath(null);
        setRepoSelectorOpen(true);
    };

    const handleFileSelect = (path: string) => {
        setActiveFilePath(path);
        setExplorerOverride(true);
    };

    const handleBackToExplorer = () => {
        setActiveFilePath(null);
    };

    const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        resizeStateRef.current = { startX: event.clientX, startWidth: panelWidth };
    };

    const handleResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!resizeStateRef.current) return;

        const delta = event.clientX - resizeStateRef.current.startX;
        const next = resizeStateRef.current.startWidth + delta;
        const clamped = Math.max(220, Math.min(800, next));
        setPanelWidth(clamped);
    };

    const handleResizeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!resizeStateRef.current) return;
        resizeStateRef.current = null;
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
            // ignore
        }
    };

    // Bridge system handlers
    const handleContextMenu = useCallback((event: React.MouseEvent, path: string, name: string) => {
        setContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            filePath: path,
            fileName: name,
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleBridge = useCallback(async (filePath: string) => {
        if (!selectedRepo) return;

        setBridgeLoading(true);
        setBridgeError(null);
        setBridgeData(null);

        try {
            const response = await fetch("/api/github/bridge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner: selectedRepo.owner.login,
                    repo: selectedRepo.name,
                    filePath,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to analyze dependencies");
            }

            setBridgeData(result.data);
        } catch (err) {
            setBridgeError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setBridgeLoading(false);
        }
    }, [selectedRepo]);

    const handleCloseBridge = useCallback(() => {
        setBridgeData(null);
        setBridgeError(null);
        setBridgeLoading(false);
    }, []);

    // Album item click handler - opens explorer panel alongside album view
    const handleAlbumItemClick = useCallback((path: string, type: "file" | "dir") => {
        setHighlightedPath(path);
        // Show explorer panel alongside album (don't close album)
        setExplorerOverride(true);
        if (type === "file") {
            setActiveFilePath(path);
        } else {
            setActiveFilePath(null);
        }
    }, []);

    return (
        <AlbumProvider>
            <ContentInner
                selectedRepo={selectedRepo}
                explorerVisible={explorerVisible}
                albumActive={albumActive}
                showAlbumView={showAlbumView}
                activeFilePath={activeFilePath}
                panelWidth={panelWidth}
                bridgeData={bridgeData}
                bridgeLoading={bridgeLoading}
                bridgeError={bridgeError}
                contextMenu={contextMenu}
                showRepoSelector={showRepoSelector}
                highlightedPath={highlightedPath}
                resizeStateRef={resizeStateRef}
                onExplorerToggle={handleExplorerToggle}
                onAlbumToggle={handleAlbumToggle}
                onSelectRepo={handleSelectRepo}
                onFileSelect={handleFileSelect}
                onChangeRepo={handleChangeRepo}
                onBackToExplorer={handleBackToExplorer}
                onContextMenu={handleContextMenu}
                onCloseContextMenu={handleCloseContextMenu}
                onBridge={handleBridge}
                onCloseBridge={handleCloseBridge}
                onRepoSelectorClose={() => selectedRepo && setRepoSelectorOpen(false)}
                onResizeStart={handleResizeStart}
                onResizeMove={handleResizeMove}
                onResizeEnd={handleResizeEnd}
                onAlbumItemClick={handleAlbumItemClick}
                setPanelWidth={setPanelWidth}
            />
        </AlbumProvider>
    );
};

interface ContentInnerProps {
    selectedRepo: GitHubRepo | null;
    explorerVisible: boolean;
    albumActive: boolean;
    showAlbumView: boolean;
    activeFilePath: string | null;
    panelWidth: number;
    bridgeData: BridgeData | null;
    bridgeLoading: boolean;
    bridgeError: string | null;
    contextMenu: FileContextMenuState;
    showRepoSelector: boolean;
    highlightedPath: string | null;
    resizeStateRef: React.MutableRefObject<{ startX: number; startWidth: number } | null>;
    onExplorerToggle: (isActive: boolean) => void;
    onAlbumToggle: (isActive: boolean) => void;
    onSelectRepo: (repo: GitHubRepo) => void;
    onFileSelect: (path: string) => void;
    onChangeRepo: () => void;
    onBackToExplorer: () => void;
    onContextMenu: (event: React.MouseEvent, path: string, name: string) => void;
    onCloseContextMenu: () => void;
    onBridge: (filePath: string) => void;
    onCloseBridge: () => void;
    onRepoSelectorClose: () => void;
    onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
    onResizeMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onResizeEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
    onAlbumItemClick: (path: string, type: "file" | "dir") => void;
    setPanelWidth: (width: number) => void;
}

const ContentInner: React.FC<ContentInnerProps> = ({
    selectedRepo,
    explorerVisible,
    albumActive,
    showAlbumView,
    activeFilePath,
    panelWidth,
    bridgeData,
    bridgeLoading,
    bridgeError,
    contextMenu,
    showRepoSelector,
    highlightedPath,
    onExplorerToggle,
    onAlbumToggle,
    onSelectRepo,
    onFileSelect,
    onChangeRepo,
    onBackToExplorer,
    onContextMenu,
    onCloseContextMenu,
    onBridge,
    onCloseBridge,
    onRepoSelectorClose,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    onAlbumItemClick,
}) => {
    const { state, fetchAlbums, openBookmarkModal, closeBookmarkModal, addBookmark, createAlbum, getBookmarkedPaths } = useAlbum();
    const [bookmarkModalKey, setBookmarkModalKey] = useState(0);

    // Fetch albums when repo changes
    useEffect(() => {
        if (selectedRepo) {
            fetchAlbums(selectedRepo.owner.login, selectedRepo.name);
        }
    }, [selectedRepo, fetchAlbums]);

    // Only highlight bookmarked paths when user is in a specific album
    const bookmarkedPaths = state.selectedAlbumId ? getBookmarkedPaths(state.selectedAlbumId) : new Set<string>();

    const handleBookmark = useCallback((filePath: string, fileName: string, fileType: "file" | "dir") => {
        setBookmarkModalKey(k => k + 1);
        openBookmarkModal(filePath, fileName, fileType);
    }, [openBookmarkModal]);

    const handleBookmarkSave = useCallback(async (albumId: string) => {
        await addBookmark(
            albumId,
            state.bookmarkModal.filePath,
            state.bookmarkModal.fileName,
            state.bookmarkModal.fileType
        );
        closeBookmarkModal();
    }, [addBookmark, state.bookmarkModal, closeBookmarkModal]);

    const handleCreateAlbumForBookmark = useCallback(async (name: string) => {
        if (!selectedRepo) return null;
        return await createAlbum(name, selectedRepo.owner.login, selectedRepo.name);
    }, [createAlbum, selectedRepo]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-black text-white">
            <div data-celitor-view-hide>
                <Toolbar />
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div data-celitor-view-hide className="h-full shrink-0">
                    <ActivityBar 
                        onExplorerToggle={onExplorerToggle}
                        onAlbumToggle={onAlbumToggle}
                        explorerActive={explorerVisible}
                        albumActive={albumActive}
                    />
                </div>
                
                {/* Explorer Panel - can show alongside Album view */}
                {selectedRepo && (
                    <div
                        data-celitor-view-hide
                        className={
                            "relative shrink-0 min-h-0 overflow-hidden " +
                            (explorerVisible ? "border-r border-gray-800" : "border-r-0")
                        }
                        style={{ width: explorerVisible ? panelWidth : 0 }}
                        aria-hidden={!explorerVisible}
                    >
                        <div
                            className={
                                (explorerVisible ? "opacity-100" : "opacity-0 pointer-events-none") +
                                (activeFilePath
                                    ? " hidden"
                                    : " flex h-full min-h-0 flex-col")
                            }
                        >
                            <FileExplorer
                                key={selectedRepo.full_name}
                                owner={selectedRepo.owner.login}
                                repo={selectedRepo.name}
                                repoFullName={selectedRepo.full_name}
                                onFileSelect={onFileSelect}
                                onChangeRepo={onChangeRepo}
                                onContextMenu={onContextMenu}
                                bookmarkedPaths={bookmarkedPaths}
                                highlightedPath={highlightedPath}
                            />
                        </div>

                        <div
                            className={
                                explorerVisible && activeFilePath
                                    ? "flex h-full min-h-0 flex-col"
                                    : "hidden"
                            }
                        >
                            {activeFilePath && (
                                <FileViewer
                                    owner={selectedRepo.owner.login}
                                    repo={selectedRepo.name}
                                    path={activeFilePath}
                                    onBack={onBackToExplorer}
                                />
                            )}
                        </div>

                        {/* Drag-to-resize handle (VS Code style) */}
                        {explorerVisible && (
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                onPointerDown={onResizeStart}
                                onPointerMove={onResizeMove}
                                onPointerUp={onResizeEnd}
                                onPointerCancel={onResizeEnd}
                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none hover:bg-slate-700/40"
                            />
                        )}
                    </div>
                )}
                
                <main data-celitor-view-content className="flex min-h-0 flex-1 relative">
                    {/* Album View */}
                    {showAlbumView && selectedRepo ? (
                        <div className="w-full h-full">
                            <AlbumPage
                                repoOwner={selectedRepo.owner.login}
                                repoName={selectedRepo.name}
                                onItemClick={onAlbumItemClick}
                            />
                        </div>
                    ) : (
                        <UsageGuide />
                    )}
                    
                    {/* Bridge Visualization Overlay */}
                    {(bridgeData || bridgeLoading || bridgeError) && (
                        <BridgeVisualization
                            data={bridgeData}
                            isLoading={bridgeLoading}
                            error={bridgeError}
                            onClose={onCloseBridge}
                            onOpenFile={onFileSelect}
                        />
                    )}
                </main>
            </div>

            {/* Repository Selector Modal */}
            {showRepoSelector && (
                <div data-celitor-view-hide>
                    <RepoSelector
                        onSelectRepo={onSelectRepo}
                        onClose={onRepoSelectorClose}
                    />
                </div>
            )}

            {/* File Context Menu */}
            <FileContextMenu
                state={contextMenu}
                onClose={onCloseContextMenu}
                onBridge={onBridge}
                onViewFile={onFileSelect}
                onBookmark={handleBookmark}
            />

            {/* Bookmark Modal */}
            <BookmarkModal
                key={bookmarkModalKey}
                isOpen={state.bookmarkModal.isOpen}
                filePath={state.bookmarkModal.filePath}
                fileName={state.bookmarkModal.fileName}
                fileType={state.bookmarkModal.fileType}
                albums={state.albums}
                onClose={closeBookmarkModal}
                onSave={handleBookmarkSave}
                onCreate={handleCreateAlbumForBookmark}
            />
        </div>
    );
};

export default ContentPage;