"use client";

import React, { useMemo } from "react";
import { 
  FileCode, 
  FileJson, 
  FileType, 
  Palette, 
  ImageIcon, 
  Settings, 
  Server,
  ArrowRight,
  ArrowLeftRight,
  X,
  Loader2,
  AlertCircle,
  Box,
  Dot
} from "lucide-react";
import type { 
  BridgeData, 
  BridgeNode, 
  BridgeEdge, 
  DependencyType,
  DependencyImportance 
} from "@/types/bridge";

// ============================================================================
// Utility Functions
// ============================================================================

const getImpactLabel = (importance: DependencyImportance) => {
  switch (importance) {
    case "critical":
      return "Core";
    case "high":
      return "Important";
    case "medium":
      return "Related";
    case "low":
      return "Peripheral";
  }
};

const getImportanceColor = (importance: DependencyImportance) => {
  // Intentionally avoids security-style red/orange semantics; this is “impact/importance”, not threat.
  switch (importance) {
    case "critical":
      return {
        dot: "bg-cyan-400",
        border: "border-cyan-400/60",
        ring: "ring-cyan-400/20",
        text: "text-cyan-200",
        badge: "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25",
        stroke: "#22d3ee",
      };
    case "high":
      return {
        dot: "bg-blue-400",
        border: "border-blue-400/60",
        ring: "ring-blue-400/20",
        text: "text-blue-200",
        badge: "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/25",
        stroke: "#60a5fa",
      };
    case "medium":
      return {
        dot: "bg-violet-400",
        border: "border-violet-400/55",
        ring: "ring-violet-400/20",
        text: "text-violet-200",
        badge: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25",
        stroke: "#a78bfa",
      };
    case "low":
      return {
        dot: "bg-slate-400",
        border: "border-slate-400/45",
        ring: "ring-slate-400/15",
        text: "text-slate-200",
        badge: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-400/20",
        stroke: "#94a3b8",
      };
  }
};

const getTypeIcon = (type: DependencyType, className: string = "h-4 w-4") => {
  switch (type) {
    case "component": return <Box className={className} />;
    case "import": return <FileCode className={className} />;
    case "function": return <FileCode className={className} />;
    case "export": return <ArrowRight className={className} />;
    case "type": return <FileType className={className} />;
    case "style": return <Palette className={className} />;
    case "asset": return <ImageIcon className={className} />;
    case "config": return <Settings className={className} />;
    case "api": return <Server className={className} />;
    default: return <FileCode className={className} />;
  }
};

const getFileIcon = (extension: string, className: string = "h-5 w-5") => {
  const ext = extension.toLowerCase();
  
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    return <FileCode className={`${className} text-blue-400`} />;
  }
  if ([".json", ".yaml", ".yml"].includes(ext)) {
    return <FileJson className={`${className} text-yellow-400`} />;
  }
  if ([".css", ".scss", ".sass", ".less"].includes(ext)) {
    return <Palette className={`${className} text-pink-400`} />;
  }
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"].includes(ext)) {
    return <ImageIcon className={`${className} text-green-400`} />;
  }
  
  return <FileCode className={`${className} text-slate-400`} />;
};

// ============================================================================
// Bridge Node Component
// ============================================================================

interface BridgeNodeComponentProps {
  node: BridgeNode;
  position: { x: number; y: number };
  isSource?: boolean;
  onClick?: (node: BridgeNode) => void;
  isSelected?: boolean;
  onHover?: (nodeId: string | null) => void;
}

const BridgeNodeComponent: React.FC<BridgeNodeComponentProps> = ({
  node,
  position,
  isSource = false,
  onClick,
  isSelected = false,
  onHover,
}) => {
  const importanceColors = getImportanceColor(node.importance);
  const impactLabel = getImpactLabel(node.importance);
  
  const nodeSize = isSource
    ? "w-40 h-28"
    : node.importance === "critical"
      ? "w-32 h-24"
      : node.importance === "high"
        ? "w-30 h-22"
        : node.importance === "medium"
          ? "w-28 h-20"
          : "w-26 h-18";

  const iconSize = isSource
    ? "h-6 w-6"
    : node.importance === "critical"
      ? "h-5 w-5"
      : "h-4 w-4";

  return (
    <div
      className={`
        absolute flex flex-col items-start justify-between
        cursor-pointer select-none
        border bg-slate-950/55
        transition-colors duration-150
        ${isSource ? "border-sky-400/55 hover:bg-slate-900/45" : `${importanceColors.border} hover:bg-slate-900/35 hover:border-slate-600/50`}
        ${isSelected ? "ring-1 ring-white/40" : ""}
        ${nodeSize}
      `}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        clipPath:
          "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
      }}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex w-full items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${isSource ? "bg-sky-400" : importanceColors.dot}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {getFileIcon(node.extension, iconSize)}
              <span className={`truncate text-sm font-semibold ${isSource ? "text-sky-200" : "text-slate-100"}`}>
                {node.name}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${isSource ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/20" : importanceColors.badge}`}>
                {isSource ? "Source" : impactLabel}
              </span>
              {!isSource && (
                <span className="text-[11px] text-slate-400">
                  {node.referenceCount} ref{node.referenceCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>

        {isSource && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/50 px-2 py-1 text-[11px] text-slate-300 ring-1 ring-slate-800">
            <Box className="h-3.5 w-3.5 text-slate-400" />
            Center
          </span>
        )}
      </div>

      <div className="w-full px-3 pb-3">
        <div className="h-px w-full bg-slate-800/60" />
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{node.path}</span>
          {!isSource && <Dot className="h-4 w-4 opacity-50" />}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Bridge Edge Component (SVG)
// ============================================================================

interface BridgeEdgeSVGProps {
  edge: BridgeEdge;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isHighlighted?: boolean;
}

const BridgeEdgeSVG: React.FC<BridgeEdgeSVGProps> = ({
  edge,
  sourcePos,
  targetPos,
  isHighlighted = false,
}) => {
  const importanceColors = getImportanceColor(edge.importance);

  const dx = targetPos.x - sourcePos.x;
  const c1x = sourcePos.x + dx * 0.35;
  const c2x = sourcePos.x + dx * 0.65;
  const c1y = sourcePos.y;
  const c2y = targetPos.y;
  const path = `M ${sourcePos.x} ${sourcePos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetPos.x} ${targetPos.y}`;

  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  
  return (
    <g>
      {/* Edge path */}
      <path
        d={path}
        fill="none"
        stroke={importanceColors.stroke}
        strokeWidth={isHighlighted ? 2.2 : 1.3}
        strokeOpacity={isHighlighted ? 0.8 : 0.22}
        strokeDasharray={edge.bidirectional ? "6 4" : undefined}
        markerEnd={`url(#arrow-${edge.importance})`}
        markerStart={edge.bidirectional ? `url(#arrow-${edge.importance})` : undefined}
      />
      
      {/* Subtle midpoint label */}
      {!!edge.label && (
        <g>
          <rect
            x={midX - Math.min(120, edge.label.length * 3.2)}
            y={midY - 64}
            width={Math.min(240, Math.max(56, edge.label.length * 6.4))}
            height={18}
            rx={9}
            fill="rgba(2,6,23,0.55)"
            stroke="rgba(148,163,184,0.18)"
          />
          <text
            x={midX}
            y={midY - 51}
            textAnchor="middle"
            className="fill-slate-300 text-[10px] font-medium"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};

// ============================================================================
// Bridge Legend Component
// ============================================================================

const BridgeLegend: React.FC = () => {
  const importanceLevels: DependencyImportance[] = ["critical", "high", "medium", "low"];
  const typeList: DependencyType[] = ["component", "import", "type", "style", "api", "config"];

  return (
    <div className="absolute top-4 right-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">Legend</h3>
      
      {/* Importance levels */}
      <div className="mb-3">
        <h4 className="text-xs text-slate-400 mb-2">Impact</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {importanceLevels.map((level) => {
            const colors = getImportanceColor(level);
            const label = getImpactLabel(level);
            return (
              <div key={level} className="flex items-center gap-1">
                <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                <span className="text-xs text-slate-200">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Dependency types */}
      <div>
        <h4 className="text-xs text-slate-400 mb-2">Types</h4>
        <div className="grid grid-cols-2 gap-1">
          {typeList.map((type) => (
            <div key={type} className="flex items-center gap-1">
              {getTypeIcon(type, "h-3 w-3 text-slate-400")}
              <span className="text-xs text-slate-300 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bidirectional */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-300">Bidirectional link</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Bridge Info Panel Component
// ============================================================================

interface BridgeInfoPanelProps {
  selectedNode: BridgeNode | null;
  bridgeData: BridgeData;
  onClose: () => void;
}

const BridgeInfoPanel: React.FC<BridgeInfoPanelProps> = ({
  selectedNode,
  bridgeData,
  onClose,
}) => {
  if (!selectedNode) return null;

  const dependency = bridgeData.dependencies.find(d => d.path === selectedNode.path);
  const importanceColors = getImportanceColor(selectedNode.importance);
  const impactLabel = getImpactLabel(selectedNode.importance);

  return (
    <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getFileIcon(selectedNode.extension, "h-6 w-6")}
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{selectedNode.name}</h3>
            <p className="text-xs text-slate-400">{selectedNode.path}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {dependency && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${importanceColors.badge}`}>
              <span className={`h-2 w-2 rounded-full ${importanceColors.dot}`} />
              {impactLabel}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
              {dependency.type}
            </span>
            {dependency.isBidirectional && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
                Bidirectional
              </span>
            )}
          </div>

          {dependency.symbols.length > 0 && (
            <div className="mb-2">
              <h4 className="text-xs text-slate-400 mb-1">Imported Symbols:</h4>
              <div className="flex flex-wrap gap-1">
                {dependency.symbols.map((symbol, i) => (
                  <code key={i} className="px-1.5 py-0.5 bg-slate-900 rounded text-xs text-blue-300">
                    {symbol}
                  </code>
                ))}
              </div>
            </div>
          )}

          {dependency.lineNumbers.length > 0 && (
            <div>
              <h4 className="text-xs text-slate-400 mb-1">Referenced at lines:</h4>
              <div className="flex flex-wrap gap-1">
                {dependency.lineNumbers.map((line, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-900 rounded text-xs text-slate-300">
                    L{line}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Bridge Stats Component
// ============================================================================

interface BridgeStatsProps {
  metadata: BridgeData["metadata"];
}

const BridgeStats: React.FC<BridgeStatsProps> = ({ metadata }) => {
  return (
    <div className="absolute top-4 left-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-2">Summary</h3>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-8">
          <span className="text-slate-400">Total Dependencies:</span>
          <span className="text-slate-200 font-medium">{metadata.totalDependencies}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-cyan-200">Core:</span>
          <span className="text-slate-200">{metadata.criticalCount}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-blue-200">Important:</span>
          <span className="text-slate-200">{metadata.highCount}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-violet-200">Related:</span>
          <span className="text-slate-200">{metadata.mediumCount}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-slate-300">Peripheral:</span>
          <span className="text-slate-200">{metadata.lowCount}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Bridge Visualization Component
// ============================================================================

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

  // Normalize node coordinates into a stable stage so SVG + HTML nodes align perfectly.
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

  // Loading state
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

  // Error state
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

  // No data state
  if (!data) {
    return null;
  }

  // No dependencies found
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

  const sourceNode = data.nodes.find(n => n.nodeType === "source");
  const dependencyNodes = data.nodes.filter(n => n.nodeType === "dependency");

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#050914]">
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:72px_72px]" />
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2 text-slate-200 transition-colors hover:bg-slate-900/60"
      >
        <X className="h-5 w-5 text-slate-300" />
      </button>

      {/* Title */}
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

      {/* Graph stage */}
      {stage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <div
            className="relative"
            style={{ width: stage.width, height: stage.height }}
          >
            {/* Lane headers */}
            {(() => {
              const levels: DependencyImportance[] = ["critical", "high", "medium", "low"];
              const labels: Record<DependencyImportance, string> = {
                critical: "Core",
                high: "Important",
                medium: "Related",
                low: "Peripheral",
              };

              return (
                <div className="pointer-events-none absolute left-0 right-0 top-2">
                  {levels.map((lvl) => {
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
              );
            })()}

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

      {/* Stats panel */}
      <BridgeStats metadata={data.metadata} />

      {/* Legend */}
      <BridgeLegend />

      {/* Info panel for selected node */}
      <BridgeInfoPanel
        selectedNode={selectedNode}
        bridgeData={data}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

export default BridgeVisualization;
