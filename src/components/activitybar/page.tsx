"use client";

import { useState } from "react";
import {
	Files,
	Album,
} from "lucide-react";

const navItems = [
	{ id: "explorer", icon: Files, tooltip: "Explorer" },
	{ id: "album", icon: Album, tooltip: "Album" },
];

const ActivityBar = () => {
	const [active, setActive] = useState<string>("explorer");

	return (
		<aside className="flex w-12 flex-col justify-between border-r border-slate-800 bg-slate-950 py-2">
			<div className="flex flex-col">
				{navItems.map(({ id, icon: Icon, tooltip }) => {
					const isActive = active === id;
					return (
						<button
							key={id}
							onClick={() => setActive(id)}
							className={`group relative flex h-12 w-12 items-center justify-center text-slate-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 cursor-pointer ${
								isActive
									? "bg-slate-900/50 text-slate-100"
									: "hover:bg-slate-900/40 hover:text-slate-200"
							}`}
							title={tooltip}
						>
							<Icon className="h-5 w-5" />
							{isActive && (
								<span
									className="absolute left-0 h-6 w-0.5 rounded-full bg-slate-100"
									aria-hidden
								/>
							)}
						</button>
					);
				})}
			</div>
		</aside>
	);
};

export default ActivityBar;
