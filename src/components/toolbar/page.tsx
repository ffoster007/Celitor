"use client";

import AvatarMenu from "./avatar";
import Image from "next/image";

const Toolbar = () => {
	return (
		<header className="sticky top-0 z-20 w-full border-b border-gray-800 bg-black/95">
			<div className="flex h-10 items-center justify-between px-4">
				<div className="flex items-center space-x-2">
					<div className="flex h-7 w-7 items-center justify-center">
						<Image
							src="/assets/dist.png"
							alt="Celitor"
							width={18}
							height={18}
							className="h-5 w-5 object-contain"
							priority
						/>
					</div>
					<div>
						<div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.12em] text-gray-500">
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<div className="ml-1">
						<AvatarMenu />
					</div>
				</div>
			</div>
		</header>
	);
};

export default Toolbar;
