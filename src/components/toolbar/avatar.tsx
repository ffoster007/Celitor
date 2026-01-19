"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { CreditCard, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";

const AvatarMenu = () => {
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

	const canUseDOM = typeof document !== "undefined";
	const portalTarget = useMemo(() => (canUseDOM ? document.body : null), [canUseDOM]);

	const updateAnchor = () => {
		const btn = buttonRef.current;
		if (!btn) return;
		const rect = btn.getBoundingClientRect();
		setAnchor({
			left: rect.right,
			top: rect.bottom,
		});
	};

	useEffect(() => {
		if (!canUseDOM) return;

		const handleClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!target) return;

			if (buttonRef.current?.contains(target)) return;
			if (menuRef.current?.contains(target)) return;
			if (rootRef.current?.contains(target)) return;
			setOpen(false);
		};

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [canUseDOM]);

	useEffect(() => {
		if (!open) return;
		if (!canUseDOM) return;

		updateAnchor();
		const onResize = () => updateAnchor();
		const onScroll = () => updateAnchor();

		window.addEventListener("resize", onResize);
		window.addEventListener("scroll", onScroll, true);
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("scroll", onScroll, true);
		};
	}, [open, canUseDOM]);

	const initial = session?.user?.name?.charAt(0)?.toUpperCase() || "G";

	return (
		<div ref={rootRef} className="relative">
			<button
				ref={buttonRef}
				onClick={() => setOpen((prev) => !prev)}
				className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-900 text-white ring-1 ring-gray-800 transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/30"
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

			{open && portalTarget && anchor
				? createPortal(
					<div
						ref={menuRef}
						className="fixed z-[60]"
						style={{ left: anchor.left, top: anchor.top + 8, transform: "translateX(-100%)" }}
					>
						<div className="w-56 rounded-md border border-gray-800 bg-black p-1 shadow-lg shadow-black/40">
							<div className="px-2 pb-2">
								<div className="text-sm font-semibold text-white">
									{session?.user?.name || "Guest"}
								</div>
								<div className="text-xs text-gray-400">
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
					</div>,
					portalTarget,
				)
				: null}
		</div>
	);
};

export default AvatarMenu;
