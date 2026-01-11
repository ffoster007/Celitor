"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { CreditCard, LogOut, Settings } from "lucide-react";
import Image from "next/image";

const AvatarMenu = () => {
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const initial = session?.user?.name?.charAt(0)?.toUpperCase() || "G";

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((prev) => !prev)}
				className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-900 text-slate-100 ring-1 ring-slate-800 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
				aria-label="User menu"
			>
				{session?.user?.image ? (
					<Image
						src={session.user.image}
						alt={session.user.name || "User"}
						width={32}
						height={32}
						unoptimized
						className="h-8 w-8 rounded-full object-cover"
					/>
				) : (
					<span className="text-sm font-semibold">{initial}</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-800 bg-slate-950 p-1 shadow-lg shadow-black/40">
					<div className="px-2 pb-2">
						<div className="text-sm font-semibold text-slate-100">
							{session?.user?.name || "Guest"}
						</div>
						<div className="text-xs text-slate-400">
							{session?.user?.email || "anonymous@celitor.dev"}
						</div>
					</div>
					<div className="space-y-1">
						<button className="flex w-full cursor-pointer items-center space-x-2 rounded-sm px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900">
							<Settings className="h-4 w-4 text-slate-300" />
							<span>Settings</span>
						</button>
						<button className="flex w-full cursor-pointer items-center space-x-2 rounded-sm px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900">
							<CreditCard className="h-4 w-4 text-slate-300" />
							<span>Billing</span>
						</button>
						<button
							onClick={() => signOut({ callbackUrl: "/" })}
							className="flex w-full cursor-pointer items-center space-x-2 rounded-sm px-3 py-2 text-sm text-rose-200 transition hover:bg-slate-900"
						>
							<LogOut className="h-4 w-4 " />
							<span>Sign out</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default AvatarMenu;
