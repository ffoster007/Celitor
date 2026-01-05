"use client";

import React, { useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

export type InfinityCanvasProps = {
	className?: string;
	children?: React.ReactNode;
	minScale?: number;
	maxScale?: number;
	initialScale?: number;
	initialTranslate?: Point;
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export default function InfinityCanvas({
	className,
	children,
	minScale = 0.2,
	maxScale = 4,
	initialScale = 1,
	initialTranslate = { x: 0, y: 0 },
}: InfinityCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const isPanningRef = useRef(false);
	const lastPointerRef = useRef<Point | null>(null);
	const activePointerIdRef = useRef<number | null>(null);

	const [view, setView] = useState(() => ({
		x: initialTranslate.x,
		y: initialTranslate.y,
		scale: clamp(initialScale, minScale, maxScale),
	}));

	const backgroundStyle = useMemo(() => {
		const minor = 24;
		const major = 120;
		const minorAlpha = 0.06;
		const majorAlpha = 0.12;

		// Use dark grid lines on white background
		return {
			backgroundImage: [
				`linear-gradient(rgba(0,0,0,${majorAlpha}) 1px, transparent 1px)`,
				`linear-gradient(90deg, rgba(0,0,0,${majorAlpha}) 1px, transparent 1px)`,
				`linear-gradient(rgba(0,0,0,${minorAlpha}) 1px, transparent 1px)`,
				`linear-gradient(90deg, rgba(0,0,0,${minorAlpha}) 1px, transparent 1px)`,
			].join(", "),
			backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`,
			backgroundPosition: `${view.x}px ${view.y}px, ${view.x}px ${view.y}px, ${view.x}px ${view.y}px, ${view.x}px ${view.y}px`,
		} as React.CSSProperties;
	}, [view.x, view.y]);

	return (
		<div
			ref={containerRef}
			className={
				"relative h-full w-full select-none overflow-hidden bg-white text-slate-900" +
				(className ? ` ${className}` : "")
			}
			style={{ touchAction: "none" }}
			onPointerDown={(e) => {
				// Left button only
				if (e.button !== 0) return;
				isPanningRef.current = true;
				activePointerIdRef.current = e.pointerId;
				lastPointerRef.current = { x: e.clientX, y: e.clientY };
				e.currentTarget.setPointerCapture(e.pointerId);
			}}
			onPointerMove={(e) => {
				if (!isPanningRef.current) return;
				if (activePointerIdRef.current !== e.pointerId) return;
				const last = lastPointerRef.current;
				if (!last) return;

				const dx = e.clientX - last.x;
				const dy = e.clientY - last.y;
				lastPointerRef.current = { x: e.clientX, y: e.clientY };

				setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
			}}
			onPointerUp={(e) => {
				if (activePointerIdRef.current === e.pointerId) {
					isPanningRef.current = false;
					activePointerIdRef.current = null;
					lastPointerRef.current = null;
				}
			}}
			onPointerCancel={() => {
				isPanningRef.current = false;
				activePointerIdRef.current = null;
				lastPointerRef.current = null;
			}}
			onWheel={(e) => {
				e.preventDefault();
				const el = containerRef.current;
				if (!el) return;
				const rect = el.getBoundingClientRect();
				const sx = e.clientX - rect.left;
				const sy = e.clientY - rect.top;

				setView((prev) => {
					const zoomIntensity = 0.0015;
					const factor = Math.exp(-e.deltaY * zoomIntensity);
					const nextScale = clamp(prev.scale * factor, minScale, maxScale);
					if (nextScale === prev.scale) return prev;

					// Keep the world point under cursor stable: screen = world*scale + translate
					const worldX = (sx - prev.x) / prev.scale;
					const worldY = (sy - prev.y) / prev.scale;
					const nextX = sx - worldX * nextScale;
					const nextY = sy - worldY * nextScale;
					return { x: nextX, y: nextY, scale: nextScale };
				});
			}}
		>
			<div className="absolute inset-0" style={backgroundStyle} />

			<div
				className="absolute inset-0"
				style={{
					transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
					transformOrigin: "0 0",
				}}
			>
				{children}
				{/* Origin marker (helps visually confirm pan/zoom) */}
				<div className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
					<div className="h-2 w-2 rounded-full bg-slate-900" />
				</div>
			</div>
		</div>
	);
}
