"use client";

import AvatarMenu from "./avatar";
import Image from "next/image";

const Toolbar = () => {

	return (
		<header className="sticky top-0 z-20 w-full border-b border-gray-800 bg-black">
			<div className="flex h-12 items-center justify-between px-3">
				<div className="flex items-center space-x-3">
					<div className="flex h-8 w-8 items-center justify-center">
						<Image
							src="/assets/dist.png"
							alt="Celitor"
							width={20}
							height={20}
							className="h-6 w-6 object-contain"
							priority
						/>
					</div>
					<div>
						<div className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
