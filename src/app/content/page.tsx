"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import ActivityBar from "@/components/activitybar/page";
import InfinityCanvas from "@/components/interface/infinitycanvas";
import Toolbar from "@/components/toolbar/page";
import { FileExplorer, FileViewer, RepoSelector } from "@/components/explorer";
import type { GitHubRepo } from "@/lib/github";

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
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [panelWidth, setPanelWidth] = useState(256);
    const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

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
        }
    };

    const handleChangeRepo = () => {
        setActiveFilePath(null);
        setRepoSelectorOpen(true);
    };

    const handleFileSelect = (path: string) => {
        setActiveFilePath(path);
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

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
            <div data-celitor-view-hide>
                <Toolbar />
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div data-celitor-view-hide>
                    <ActivityBar 
                        onExplorerToggle={handleExplorerToggle}
                        explorerActive={explorerVisible}
                    />
                </div>
                
                {/* Explorer Panel */}
                {selectedRepo && (
                    <div
                        data-celitor-view-hide
                        className={
                            "relative shrink-0 min-h-0 overflow-hidden " +
                            (explorerVisible ? "border-r border-slate-800" : "border-r-0")
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
                                onFileSelect={handleFileSelect}
                                onChangeRepo={handleChangeRepo}
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
                                    onBack={handleBackToExplorer}
                                />
                            )}
                        </div>

                        {/* Drag-to-resize handle (VS Code style) */}
                        {explorerVisible && (
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                onPointerDown={handleResizeStart}
                                onPointerMove={handleResizeMove}
                                onPointerUp={handleResizeEnd}
                                onPointerCancel={handleResizeEnd}
                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none hover:bg-slate-700/40"
                            />
                        )}
                    </div>
                )}
                
                <main data-celitor-view-content className="flex min-h-0 flex-1">
                    <InfinityCanvas />
                </main>
            </div>

            {/* Repository Selector Modal */}
            {showRepoSelector && (
                <div data-celitor-view-hide>
                    <RepoSelector
                        onSelectRepo={handleSelectRepo}
                        onClose={() => {
                            if (selectedRepo) {
                                setRepoSelectorOpen(false);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ContentPage;