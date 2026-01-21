"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, Loader2, AlertCircle, Box, FileCode } from "lucide-react";
import type { BridgeData, BridgeNode, DependencyImportance } from "@/types/bridge";
import {
  BridgeNodeComponent,
  BridgeEdgeSVG,
  BridgeLegend,
  BridgeInfoPanel,
  BridgeStats,
  getImportanceColor,
} from "./visual";

interface BridgeVisualizationProps {
  data: BridgeData | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onOpenFile: (path: string) => void;
}

export const BridgeVisualization: React.FC<BridgeVisualizationProps> = ({
  data,
  isLoading = false,
  error = null,
  onClose,
  onOpenFile,
}) => {
  const [selectedNode, setSelectedNode] = React.useState<BridgeNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const [view, setView] = useState(() => ({ x: 0, y: 0, scale: 1 }));

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const minScale = 0.2;
  const maxScale = 4;

  const zoomBy = (deltaScale: number, center?: { x: number; y: number }) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sx = center?.x ?? rect.width / 2;
    const sy = center?.y ?? rect.height / 2;

    setView((prev) => {
      const nextScale = clamp(prev.scale + deltaScale, minScale, maxScale);
      if (nextScale === prev.scale) return prev;

      const worldX = (sx - prev.x) / prev.scale;
      const worldY = (sy - prev.y) / prev.scale;
      const nextX = sx - worldX * nextScale;
      const nextY = sy - worldY * nextScale;
      return { x: nextX, y: nextY, scale: nextScale };
    });
  };

  const stage = useMemo(() => {
    if (!data) return null;

    const padding = 220;
    const xs = data.nodes.map((n) => n.position.x);
    const ys = data.nodes.map((n) => n.position.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = Math.max(720, maxX - minX + padding * 2);
    const height = Math.max(520, maxY - minY + padding * 2);

    const positionsById = new Map<string, { x: number; y: number }>();
    for (const node of data.nodes) {
      positionsById.set(node.id, {
        x: node.position.x - minX + padding,
        y: node.position.y - minY + padding,
      });
    }

    return { width, height, positionsById };
  }, [data]);

  const gridStyle = useMemo(() => {
    const minor = 24;
    const major = 120;
    const minorAlpha = 0.06;
    const majorAlpha = 0.12;
    return {
      backgroundImage: [
        `linear-gradient(rgba(255,255,255,${majorAlpha}) 1px, transparent 1px)`,
        `linear-gradient(90deg, rgba(255,255,255,${majorAlpha}) 1px, transparent 1px)`,
        `linear-gradient(rgba(255,255,255,${minorAlpha}) 1px, transparent 1px)`,
        `linear-gradient(90deg, rgba(255,255,255,${minorAlpha}) 1px, transparent 1px)`,
      ].join(", "),
      backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`,
      backgroundPosition: `${view.x}px ${view.y}px, ${view.x}px ${view.y}px, ${view.x}px ${view.y}px, ${view.x}px ${view.y}px`,
      opacity: 0.06,
    } as React.CSSProperties;
  }, [view.x, view.y]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-slate-300 font-medium">Analyzing dependencies...</p>
          <p className="text-slate-500 text-sm">This may take a moment for large files</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-slate-300 font-medium">Analysis Failed</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.dependencies.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <FileCode className="h-12 w-12 text-slate-500" />
          <p className="text-slate-300 font-medium">No Dependencies Found</p>
          <p className="text-slate-500 text-sm">
            The file &quot;{data.sourceFile.name}&quot; does not import any local files from this repository.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const sourceNode = data.nodes.find((n) => n.nodeType === "source");
  const dependencyNodes = data.nodes.filter((n) => n.nodeType === "dependency");

  const handleNodeSelect = (node: BridgeNode) => {
    setSelectedNode(node);
    onOpenFile(node.path);
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#050914]">
      <div className="absolute inset-0" style={gridStyle} />

        <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 cursor-pointer border border-red-800/80 bg-red-950/50 p-2 text-red-200 transition-colors hover:bg-red-900/60"
        >
        <X className="h-5 w-5 text-red-300" />
        </button>


      <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-slate-800/80 bg-slate-950/55 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-400/20">
            <Box className="h-4.5 w-4.5 text-sky-200" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400">Bridge</div>
            <div className="truncate text-sm font-semibold text-slate-100">{data.sourceFile.name}</div>
          </div>
        </div>
      </div>

      {stage && (
        <div
          ref={containerRef}
          className="absolute inset-0 z-10 select-none"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-bridge-node],[data-bridge-control]")) return;
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

              const worldX = (sx - prev.x) / prev.scale;
              const worldY = (sy - prev.y) / prev.scale;
              const nextX = sx - worldX * nextScale;
              const nextY = sy - worldY * nextScale;
              return { x: nextX, y: nextY, scale: nextScale };
            });
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="relative" style={{ width: stage.width, height: stage.height }}>
            {/* Lane headers */}
            <div className="pointer-events-none absolute left-0 right-0 top-2">
              {(["critical", "high", "medium", "low"] as DependencyImportance[]).map((lvl) => {
                const ids = data.nodes
                  .filter((n) => n.nodeType === "dependency" && n.importance === lvl)
                  .map((n) => n.id);
                if (ids.length === 0) return null;

                const xs = ids
                  .map((id) => stage.positionsById.get(id)?.x)
                  .filter((x): x is number => typeof x === "number");
                if (xs.length === 0) return null;
                const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;

                const c = getImportanceColor(lvl);
                const labels: Record<DependencyImportance, string> = {
                  critical: "Core",
                  high: "Important",
                  medium: "Related",
                  low: "Peripheral",
                };

                return (
                  <div
                    key={lvl}
                    className="absolute -translate-x-1/2 rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-200"
                    style={{ left: centerX, top: 0 }}
                  >
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full ${c.dot}`} />
                    {labels[lvl]}
                  </div>
                );
              })}
            </div>

            {/* SVG edges */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              width={stage.width}
              height={stage.height}
            >
              <defs>
                {(["critical", "high", "medium", "low"] as DependencyImportance[]).map((lvl) => (
                  <marker
                    key={lvl}
                    id={`arrow-${lvl}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={getImportanceColor(lvl).stroke} opacity={0.9} />
                  </marker>
                ))}
              </defs>

              {data.edges.map((edge) => {
                const source = data.nodes.find((n) => n.id === edge.source);
                const target = data.nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const sourcePos = stage.positionsById.get(source.id);
                const targetPos = stage.positionsById.get(target.id);
                if (!sourcePos || !targetPos) return null;

                const activeId = hoveredNodeId ?? selectedNode?.id ?? null;
                const isActive = activeId === target.id || activeId === source.id;
                return (
                  <g key={edge.id}>
                    <BridgeEdgeSVG
                      edge={edge}
                      sourcePos={sourcePos}
                      targetPos={targetPos}
                      isHighlighted={isActive}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {sourceNode && stage.positionsById.get(sourceNode.id) && (
              <BridgeNodeComponent
                node={sourceNode}
                position={stage.positionsById.get(sourceNode.id)!}
                isSource
                onClick={handleNodeSelect}
                onHover={setHoveredNodeId}
                isSelected={selectedNode?.id === sourceNode.id}
              />
            )}

            {dependencyNodes.map((node) => {
              const pos = stage.positionsById.get(node.id);
              if (!pos) return null;
              return (
                <BridgeNodeComponent
                  key={node.id}
                  node={node}
                  position={pos}
                  onClick={handleNodeSelect}
                  onHover={setHoveredNodeId}
                  isSelected={selectedNode?.id === node.id}
                />
              );
            })}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto absolute right-4 bottom-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="h-9 w-9 rounded-md border border-white/20 bg-black/60 text-lg text-white shadow-sm transition hover:bg-white/10"
              data-bridge-control
              onClick={() => zoomBy(0.2)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-md border border-white/20 bg-black/60 text-lg text-white shadow-sm transition hover:bg-white/10"
              data-bridge-control
              onClick={() => zoomBy(-0.2)}
              aria-label="Zoom out"
            >
              -
            </button>
          </div>
        </div>
      )}

      <BridgeStats metadata={data.metadata} />
      <BridgeLegend />
      <BridgeInfoPanel selectedNode={selectedNode} bridgeData={data} onClose={() => setSelectedNode(null)} />
    </div>
  );
};

export default BridgeVisualization;
