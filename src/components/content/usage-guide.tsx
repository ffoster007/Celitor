"use client";

import React from "react";
import {
	Network,
	FolderGit2,
	MousePointerClick,
	FileCode2,
	Search,
	Info,
	Sparkles,
	ArrowRight,
} from "lucide-react";

export default function UsageGuide() {
	return (
		<div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto bg-black px-6 py-10 text-white">
			<div className="w-full max-w-5xl">
				<div className="mb-8 rounded-2xl border border-gray-800/70 bg-gradient-to-b from-gray-900/60 to-black/40 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="min-w-0">
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-black/60 px-3 py-1 text-xs font-medium text-gray-300">
								<Sparkles className="h-3.5 w-3.5 text-gray-400" />
								Bridge · Dependency Visualization
							</div>
							<h1 className="text-3xl font-semibold tracking-tight text-white">
								How to use Bridge
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
								Bridge helps you understand how a file connects to the rest of a repository by turning imports into a clear,
								interactive graph. Dependencies are ranked from most to least important so you can follow the code path faster.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<div className="rounded-xl border border-gray-800 bg-black/40 px-3 py-2 text-xs text-gray-300">
								Tip: Right‑click a file in Explorer
							</div>
							<div className="rounded-xl bg-blue-600/15 px-3 py-2 text-xs font-medium text-blue-200 ring-1 ring-blue-500/20">
								Bridge
								<ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
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

					<div className="rounded-2xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<FileCode2 className="h-5 w-5 text-blue-400" />
							<h2 className="text-lg font-semibold text-white">2) Choose a file</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Click a file in Explorer to open it.</li>
							<li>
								Bridge analysis is available for code files such as{" "}
								<span className="rounded-md bg-black/60 px-2 py-0.5 text-white ring-1 ring-gray-800">
									.ts / .tsx / .js / .jsx
								</span>
							</li>
						</ul>
					</div>

					<div className="rounded-2xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<MousePointerClick className="h-5 w-5 text-gray-200" />
							<h2 className="text-lg font-semibold text-white">3) Right‑click → Bridge</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>Right‑click the file in Explorer.</li>
							<li>Select <span className="font-medium text-white">Bridge</span>.</li>
							<li>Wait for analysis to complete (large repos may take longer).</li>
						</ul>
						<div className="mt-4 flex items-start gap-2 rounded-xl bg-black/60 px-3 py-2 text-xs text-gray-300 ring-1 ring-gray-800">
							<Info className="h-4 w-4 text-gray-400" />
							<span>
								If the menu does not appear, make sure you right‑click a file row (not empty space).
							</span>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-800/80 bg-gray-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
						<div className="flex items-center gap-3">
							<Network className="h-5 w-5 text-purple-400" />
							<h2 className="text-lg font-semibold text-white">4) Read the graph</h2>
						</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-300">
							<li>The selected file is in the center.</li>
							<li>More important dependencies are placed closer and use stronger colors.</li>
							<li>Click a node to see imported symbols and line references.</li>
						</ul>
					</div>
				</div>

				<div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
					<div className="flex items-center gap-3">
						<Search className="h-5 w-5 text-emerald-400" />
						<h2 className="text-lg font-semibold text-slate-50">How importance is ranked</h2>
					</div>
					<p className="mt-3 text-sm leading-relaxed text-slate-300">
						Bridge prioritizes dependencies that are referenced frequently (especially components/imports) and highlights tight coupling
						(bidirectional imports). This helps surface the most influential connections first.
					</p>
					<div className="mt-4 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
						<div className="rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-slate-800">
							<span className="font-medium text-slate-100">Core / Important:</span> primary relationships that strongly affect behavior.
						</div>
						<div className="rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-slate-800">
							<span className="font-medium text-slate-100">Related / Peripheral:</span> secondary links or low-frequency references.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
