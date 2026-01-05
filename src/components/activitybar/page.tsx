"use client";

import { useState } from "react";
import {
	Blocks,
	Bot,
	Database,
	GitBranch,
	Settings,
} from "lucide-react";

const navItems = [
	{ id: "explorer", icon: Blocks, tooltip: "Explorer" },
	{ id: "data", icon: Database, tooltip: "Schemas" },
	{ id: "ai", icon: Bot, tooltip: "Copilot" },
	{ id: "git", icon: GitBranch, tooltip: "Source Control" },
	{ id: "settings", icon: Settings, tooltip: "Settings" },
];

const ActivityBar = () => {
	const [active, setActive] = useState<string>("explorer");

	return (
		<aside className="flex w-16 flex-col justify-between border-r border-slate-800 bg-[#0f1720] px-2 py-4">
			<div className="flex flex-col space-y-3">
				{navItems.map(({ id, icon: Icon, tooltip }) => {
					const isActive = active === id;
					return (
						<button
							key={id}
							onClick={() => setActive(id)}
							className={`relative flex items-center justify-center rounded-lg p-3 text-slate-400 transition hover:bg-slate-900 focus:outline-none ${
								isActive ? "text-emerald-200" : ""
							}`}
							title={tooltip}
						>
							<Icon className="h-5 w-5" />
							{isActive && (
								<span className="absolute right-[-6px] h-8 w-0.5 rounded-full bg-emerald-300" aria-hidden />
							)}
						</button>
					);
				})}
			</div>
		</aside>
	);
};

export default ActivityBar;
