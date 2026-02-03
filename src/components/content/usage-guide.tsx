"use client";

import React from "react";
import {
	FolderGit2,
	FileCode2,
	Bookmark,
	Info,
	Sparkles,
	ArrowRight,
	Album,
} from "lucide-react";

export default function UsageGuide() {
	return (
		<div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto bg-black px-6 py-10 text-white">
			<div className="w-full max-w-5xl">
				<div className="mb-8 rounded-xl border border-gray-800/70 from-gray-900/60 bg-gray-900/30 to-black/40 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="min-w-0">
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-black/60 px-3 py-1 text-xs font-medium text-gray-300">
								<Sparkles className="h-3.5 w-3.5 text-gray-400" />
								Getting Started
							</div>
							<h1 className="text-3xl font-semibold tracking-tight text-white">
								How to use Celitor
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
								Celitor helps you explore GitHub repositories, view files, and organize important code snippets into albums.
								Bookmark files and folders to keep track of what matters most.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<div className="rounded-xl border border-gray-800 bg-black/40 px-3 py-2 text-xs text-gray-300">
								Tip: Right‑click a file to bookmark
							</div>
							<div className="rounded-xl bg-blue-600/15 px-3 py-2 text-xs font-medium text-blue-200 ring-1 ring-blue-500/20">
								Bookmark
								<ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<FolderGit2 className="h-5 w-5 text-yellow-400" />
							<h2 className="text-lg font-semibold text-white">1) Select a repository</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Open the Content page.</li>
							<li>Pick a repo from the Repo Selector modal.</li>
							<li>Explorer will load the repository tree.</li>
						</ul>
					</div>

					<div className="rounded-xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<FileCode2 className="h-5 w-5 text-blue-400" />
							<h2 className="text-lg font-semibold text-white">2) Browse files</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Click folders to expand them.</li>
							<li>Click a file to view its contents.</li>
							<li>Use the back button to return to the explorer.</li>
						</ul>
					</div>

					<div className="rounded-xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<Bookmark className="h-5 w-5 text-orange-400" />
							<h2 className="text-lg font-semibold text-white">3) Bookmark important files</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Right‑click any file or folder in Explorer.</li>
							<li>Select <span className="font-medium text-white">Bookmark</span>.</li>
							<li>Choose or create an album to save it to.</li>
						</ul>
						<div className="mt-4 flex items-start gap-2 rounded-xl bg-black/60 px-3 py-2 text-xs text-gray-300 ring-1 ring-gray-800">
							<Info className="h-4 w-4 text-gray-400" />
							<span>
								Bookmarks help you quickly access important parts of a codebase.
							</span>
						</div>
					</div>

					<div className="rounded-xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<Album className="h-5 w-5 text-purple-400" />
							<h2 className="text-lg font-semibold text-white">4) Organize with albums</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Click the Album icon in the activity bar.</li>
							<li>Create albums to group related bookmarks.</li>
							<li>Click any bookmark to jump to that file.</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
