"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  File,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import type { GitHubContent } from "@/lib/github";

interface FileTreeItemProps {
  item: GitHubContent;
  owner: string;
  repo: string;
  level: number;
  onFileSelect?: (path: string) => void;
}

const FileTreeItem = ({
  item,
  owner,
  repo,
  level,
  onFileSelect,
}: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<GitHubContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = useCallback(async () => {
    if (item.type === "file") {
      onFileSelect?.(item.path);
      return;
    }

    // Toggle folder open/close
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // Load children if not loaded
    if (!loaded) {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/github/contents?owner=${owner}&repo=${repo}&path=${encodeURIComponent(item.path)}`
        );
        if (response.ok) {
          const data = await response.json();
          setChildren(data);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Error loading folder contents:", error);
      } finally {
        setLoading(false);
      }
    }

    setIsOpen(true);
  }, [item, owner, repo, isOpen, loaded, onFileSelect]);

  const isFolder = item.type === "dir";

  // Get file icon based on extension
  const getFileIcon = () => {
    return <File className="h-4 w-4 shrink-0 text-slate-400" />;
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className="group flex w-full items-center gap-1 py-0.5 pr-2 text-left text-sm text-slate-300 hover:bg-slate-800/50"
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
          ) : isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
          )
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
          )
        ) : (
          getFileIcon()
        )}

        {/* Name */}
        <span className="truncate">{item.name}</span>
      </button>

      {/* Children */}
      {isFolder && isOpen && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              owner={owner}
              repo={repo}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FileExplorerProps {
  owner: string;
  repo: string;
  repoFullName: string;
  onFileSelect?: (path: string) => void;
  onChangeRepo?: () => void;
}

const FileExplorer = ({
  owner,
  repo,
  repoFullName,
  onFileSelect,
  onChangeRepo,
}: FileExplorerProps) => {
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Load root contents whenever repo changes
  useEffect(() => {
    let cancelled = false;

    const loadContents = async () => {
      try {
        setError(null);
        setContents([]);
        setLoading(true);

        const response = await fetch(
          `/api/github/contents?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
        );
        if (!response.ok) {
          throw new Error("Failed to load repository contents");
        }
        const data = await response.json();
        if (!cancelled) {
          setContents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContents();
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScrollTop = scrollHeight - clientHeight;
      const overflow = maxScrollTop > 1;
      setCanScrollUp(overflow && scrollTop > 1);
      setCanScrollDown(overflow && scrollTop < maxScrollTop - 1);
    };

    update();

    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [contents, loading, error]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Explorer
        </span>
      </div>

      {/* Repo name */}
      <button
        onClick={onChangeRepo}
        className="group flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 text-left hover:bg-slate-800/50 cursor-pointer"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
          <span className="truncate text-sm font-medium text-slate-200">
            {repoFullName}
          </span>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400 group-hover:text-slate-200">
          Change
        </span>
      </button>

      {/* File tree */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="px-3 py-4 text-center text-sm text-red-400">
            {error}
          </div>
        ) : contents.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-slate-500">
            Empty repository
          </div>
        ) : (
          contents.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              owner={owner}
              repo={repo}
              level={0}
              onFileSelect={onFileSelect}
            />
          ))
        )}
        </div>

        {/* Scroll indicators */}
        {canScrollUp && (
          <div className="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-center bg-gradient-to-b from-slate-900 to-transparent pt-1">
            <ChevronUp className="h-4 w-4 text-slate-500" />
          </div>
        )}
        {canScrollDown && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center bg-gradient-to-t from-slate-900 to-transparent pb-1">
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
