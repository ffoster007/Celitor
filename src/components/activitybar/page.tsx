"use client";

import { useState } from "react";
import {
	Files,
	Album,
} from "lucide-react";

interface ActivityBarProps {
	onExplorerToggle?: (isActive: boolean) => void;
	onAlbumToggle?: (isActive: boolean) => void;
	explorerActive?: boolean;
	albumActive?: boolean;
}

const navItems = [
	{ id: "explorer", icon: Files, tooltip: "Explorer", showIndicator: true },
	{ id: "album", icon: Album, tooltip: "Album", showIndicator: true },
];

const ActivityBar = ({ onExplorerToggle, onAlbumToggle, explorerActive = false, albumActive = false }: ActivityBarProps) => {
	const [active, setActive] = useState<string | null>(() => {
		if (explorerActive) return "explorer";
		if (albumActive) return "album";
		return null;
	});

	const getCurrentActive = () => {
		if (albumActive) return "album";
		if (explorerActive) return "explorer";
		return active;
	};

	const currentActive = getCurrentActive();

	const handleClick = (id: string) => {
		if (id === "explorer") {
			const newState = currentActive === "explorer" ? null : "explorer";
			setActive(newState);
			onExplorerToggle?.(newState === "explorer");
			if (newState === "explorer") onAlbumToggle?.(false);
		} else if (id === "album") {
			const newState = currentActive === "album" ? null : "album";
			setActive(newState);
			onAlbumToggle?.(newState === "album");
			if (newState === "album") onExplorerToggle?.(false);
		}
	};

	return (
		<aside className="flex h-full w-12 flex-col justify-between border-r border-gray-800 bg-black py-2">
			<div className="flex flex-col">
				{navItems.map(({ id, icon: Icon, tooltip, showIndicator }) => {
					const isActive = currentActive === id;
					return (
						<button
							key={id}
							onClick={() => handleClick(id)}
							className={`group relative flex h-12 w-12 items-center justify-center text-slate-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 cursor-pointer ${
								isActive
									? "bg-slate-900/50 text-slate-100"
									: "hover:bg-slate-900/40 hover:text-slate-200"
							}`}
							title={tooltip}
						>
							<Icon className="h-5 w-5" />
							{isActive && showIndicator && (
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
