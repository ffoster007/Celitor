"use client";

import { useState } from "react";
import ActivityBar from "@/components/activitybar/page";
import InfinityCanvas from "@/components/interface/infinitycanvas";
import Toolbar from "@/components/toolbar/page";
import { FileExplorer, RepoSelector } from "@/components/explorer";
import type { GitHubRepo } from "@/lib/github";

// Helper function to get initial repo from localStorage
const getInitialRepo = (): GitHubRepo | null => {
    if (typeof window === "undefined") return null;
    const savedRepo = localStorage.getItem("celitor_selected_repo");
    if (savedRepo) {
        try {
            return JSON.parse(savedRepo);
        } catch {
            return null;
        }
    }
    return null;
};

const ContentPage = () => {
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(() => getInitialRepo());
    const [showRepoSelector, setShowRepoSelector] = useState(() => !getInitialRepo());
    const [explorerVisible, setExplorerVisible] = useState(() => !!getInitialRepo());

    const handleSelectRepo = (repo: GitHubRepo) => {
        setSelectedRepo(repo);
        setShowRepoSelector(false);
        setExplorerVisible(true);
        // Save to localStorage
        localStorage.setItem("celitor_selected_repo", JSON.stringify(repo));
    };

    const handleExplorerToggle = (isActive: boolean) => {
        if (isActive && !selectedRepo) {
            setShowRepoSelector(true);
        } else {
            setExplorerVisible(isActive);
        }
    };

    const handleChangeRepo = () => {
        setShowRepoSelector(true);
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
                            setShowRepoSelector(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ContentPage;