"use client";

import AvatarMenu from "./avatar";

const Toolbar = () => {

	return (
		<header className="relative z-20 w-full border-b border-slate-800 bg-[#0f1720]">
			<div className="flex items-center justify-between px-5 py-3">
				<div className="flex items-center space-x-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-800">
						<span className="text-sm font-semibold text-emerald-200">CE</span>
					</div>
					<div>
						<div className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.08em] text-slate-400">
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<div className="ml-2">
						<AvatarMenu />
					</div>
				</div>
			</div>
		</header>
	);
};

export default Toolbar;
