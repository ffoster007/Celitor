"use client";

import React, { useMemo } from "react";
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
}

export const BridgeVisualization: React.FC<BridgeVisualizationProps> = ({
  data,
  isLoading = false,
  error = null,
  onClose,
}) => {
  const [selectedNode, setSelectedNode] = React.useState<BridgeNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);

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

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#050914]">
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:72px_72px]" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2 text-slate-200 transition-colors hover:bg-slate-900/60 cursor-pointer"
      >
        <X className="h-5 w-5 text-slate-300" />
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
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
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
                onClick={setSelectedNode}
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
                  onClick={setSelectedNode}
                  onHover={setHoveredNodeId}
                  isSelected={selectedNode?.id === node.id}
                />
              );
            })}
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
