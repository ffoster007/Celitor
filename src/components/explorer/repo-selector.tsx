"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GitBranch, Search, Loader2, Lock, Globe } from "lucide-react";
import type { GitHubRepo } from "@/lib/github";

interface RepoSelectorProps {
  onSelectRepo: (repo: GitHubRepo) => void;
  onClose: () => void;
}

const RepoSelector = ({ onSelectRepo, onClose }: RepoSelectorProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/github/repos");
        
        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }
        
        const data = await response.json();
        setRepos(data);
        setFilteredRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRepos(repos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRepos(
        repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(query) ||
            repo.full_name.toLowerCase().includes(query) ||
            repo.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, repos]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">
              Select Repository
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Repository List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading repositories...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>No repositories found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {filteredRepos.map((repo) => (
                <li key={repo.id}>
                  <button
                    onClick={() => onSelectRepo(repo)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-800/50"
                  >
                    <Image
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-white">
                          {repo.full_name}
                        </span>
                        {repo.private ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="mt-1 text-sm text-gray-400">
                          {repo.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {repo.language && <span>{repo.language}</span>}
                        <span>Updated {formatDate(repo.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoSelector;
