"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import ActivityBar from "@/components/activitybar/page";
import InfinityCanvas from "@/components/interface/infinitycanvas";
import Toolbar from "@/components/toolbar/page";
import { FileExplorer, RepoSelector } from "@/components/explorer";
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

    const explorerVisible = selectedRepo ? (explorerOverride ?? true) : false;
    const showRepoSelector = hydrated && (repoSelectorOpen || !selectedRepo);

    const handleSelectRepo = (repo: GitHubRepo) => {
        setRepoSelectorOpen(false);
        setExplorerOverride(true);
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
        setRepoSelectorOpen(true);
    };

    const handleFileSelect = (path: string) => {
        console.log("Selected file:", path);
        // TODO: Handle file selection (open in editor, etc.)
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Toolbar />
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <ActivityBar 
                    onExplorerToggle={handleExplorerToggle}
                    explorerActive={explorerVisible}
                />
                
                {/* Explorer Panel */}
                {explorerVisible && selectedRepo && (
                    <div className="w-64 border-r border-slate-800">
                        <FileExplorer
                            key={selectedRepo.full_name}
                            owner={selectedRepo.owner.login}
                            repo={selectedRepo.name}
                            repoFullName={selectedRepo.full_name}
                            onFileSelect={handleFileSelect}
                            onChangeRepo={handleChangeRepo}
                        />
                    </div>
                )}
                
                <main className="flex min-h-0 flex-1">
                    <InfinityCanvas />
                </main>
            </div>

            {/* Repository Selector Modal */}
            {showRepoSelector && (
                <RepoSelector
                    onSelectRepo={handleSelectRepo}
                    onClose={() => {
                        if (selectedRepo) {
                            setRepoSelectorOpen(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ContentPage;