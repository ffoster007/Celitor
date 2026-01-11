"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  X,
  FileCode2,
  Package,
  Component,
  Puzzle,
  FileJson,
  Palette,
  File,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

// Types
export interface DependencyLink {
  targetPath: string;
  importType: "default" | "named" | "namespace" | "sideEffect";
  importNames: string[];
  lineNumber: number;
  isExternal: boolean;
}

export interface DependencyNode {
  path: string;
  name: string;
  type: "component" | "utility" | "type" | "api" | "page" | "config" | "style" | "file" | "external";
  importance: number;
  dependencies: DependencyLink[];
  exports: string[];
  language: string;
}

export interface BridgeData {
  sourceFile: DependencyNode;
  dependencies: DependencyNode[];
  dependents: DependencyNode[];
  totalNodes: number;
  totalEdges: number;
}

interface BridgeViewProps {
  data: BridgeData;
  onClose: () => void;
  onNodeClick?: (path: string) => void;
}

// Node type colors and icons
const nodeTypeConfig: Record<DependencyNode["type"], { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  component: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-950/80",
    borderColor: "border-emerald-500/50",
    icon: <Component className="h-4 w-4" />,
  },
  utility: {
    color: "text-blue-400",
    bgColor: "bg-blue-950/80",
    borderColor: "border-blue-500/50",
    icon: <Puzzle className="h-4 w-4" />,
  },
  type: {
    color: "text-purple-400",
    bgColor: "bg-purple-950/80",
    borderColor: "border-purple-500/50",
    icon: <FileCode2 className="h-4 w-4" />,
  },
  api: {
    color: "text-orange-400",
    bgColor: "bg-orange-950/80",
    borderColor: "border-orange-500/50",
    icon: <FileCode2 className="h-4 w-4" />,
  },
  page: {
    color: "text-cyan-400",
    bgColor: "bg-cyan-950/80",
    borderColor: "border-cyan-500/50",
    icon: <FileCode2 className="h-4 w-4" />,
  },
  config: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-950/80",
    borderColor: "border-yellow-500/50",
    icon: <FileJson className="h-4 w-4" />,
  },
  style: {
    color: "text-pink-400",
    bgColor: "bg-pink-950/80",
    borderColor: "border-pink-500/50",
    icon: <Palette className="h-4 w-4" />,
  },
  file: {
    color: "text-slate-400",
    bgColor: "bg-slate-800/80",
    borderColor: "border-slate-500/50",
    icon: <File className="h-4 w-4" />,
  },
  external: {
    color: "text-amber-400",
    bgColor: "bg-amber-950/80",
    borderColor: "border-amber-500/50",
    icon: <Package className="h-4 w-4" />,
  },
};

// Calculate node positions in a circular layout
function calculateNodePositions(
  source: DependencyNode,
  dependencies: DependencyNode[],
  dependents: DependencyNode[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = width / 2;
  const centerY = height / 2;

  // Source in center
  positions.set(source.path, { x: centerX, y: centerY });

  // Dependencies on the right
  const depRadius = Math.min(width, height) * 0.35;
  const depStartAngle = -Math.PI / 3;
  const depEndAngle = Math.PI / 3;
  
  dependencies.forEach((dep, index) => {
    const angle = dependencies.length === 1 
      ? 0 
      : depStartAngle + (index / (dependencies.length - 1)) * (depEndAngle - depStartAngle);
    const x = centerX + depRadius * Math.cos(angle) + 150;
    const y = centerY + depRadius * Math.sin(angle);
    positions.set(dep.path, { x, y });
  });

  // Dependents on the left
  const depndntRadius = Math.min(width, height) * 0.35;
  const depndntStartAngle = Math.PI - Math.PI / 3;
  const depndntEndAngle = Math.PI + Math.PI / 3;
  
  dependents.forEach((dep, index) => {
    const angle = dependents.length === 1 
      ? Math.PI 
      : depndntStartAngle + (index / (dependents.length - 1)) * (depndntEndAngle - depndntStartAngle);
    const x = centerX + depndntRadius * Math.cos(angle) - 150;
    const y = centerY + depndntRadius * Math.sin(angle);
    positions.set(dep.path, { x, y });
  });

  return positions;
}

// Node component
function BridgeNode({
  node,
  x,
  y,
  isSource,
  onClick,
}: {
  node: DependencyNode;
  x: number;
  y: number;
  isSource: boolean;
  onClick?: () => void;
}) {
  const config = nodeTypeConfig[node.type];
  const nodeWidth = isSource ? 200 : 180;
  const nodeHeight = isSource ? 80 : 60;

  return (
    <g
      transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}
      className="cursor-pointer transition-transform hover:scale-105"
      onClick={onClick}
    >
      {/* Node background */}
      <foreignObject width={nodeWidth} height={nodeHeight}>
        <div
          className={`
            h-full w-full rounded-lg border-2 backdrop-blur-sm
            ${config.bgColor} ${config.borderColor}
            ${isSource ? "ring-2 ring-white/30 ring-offset-2 ring-offset-slate-900" : ""}
            transition-all duration-200 hover:brightness-110
          `}
        >
          <div className="flex h-full flex-col justify-center px-3 py-2">
            {/* Header with icon */}
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.icon}</span>
              <span
                className={`truncate text-sm font-medium ${config.color}`}
                title={node.name}
              >
                {node.name}
              </span>
              {node.type === "external" && (
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-500" />
              )}
            </div>
            
            {/* Path (truncated) */}
            <div className="mt-1 truncate text-xs text-slate-500" title={node.path}>
              {node.path.length > 30 ? "..." + node.path.slice(-27) : node.path}
            </div>

            {/* Importance badge */}
            {node.importance > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">
                  ★ {node.importance}
                </span>
                {node.exports.length > 0 && (
                  <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {node.exports.length} exports
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

// Edge component
function BridgeEdge({
  fromX,
  fromY,
  toX,
  toY,
  isOutgoing,
  importNames,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isOutgoing: boolean;
  importNames: string[];
}) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  // Control points for curved line
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const offset = Math.abs(dx) * 0.2;
  
  const path = `M ${fromX} ${fromY} Q ${midX + (isOutgoing ? offset : -offset)} ${midY}, ${toX} ${toY}`;
  
  // Arrow marker position
  const angle = Math.atan2(dy, dx);
  const arrowAngle = Math.PI / 6;
  
  return (
    <g className="pointer-events-none">
      {/* Edge line */}
      <path
        d={path}
        fill="none"
        stroke={isOutgoing ? "#60a5fa" : "#f472b6"}
        strokeWidth={2}
        strokeOpacity={0.6}
        className="transition-opacity hover:opacity-100"
      />
      
      {/* Arrow head */}
      <polygon
        points={`
          ${toX - 10 * Math.cos(angle)},${toY - 10 * Math.sin(angle)}
          ${toX - 20 * Math.cos(angle - arrowAngle)},${toY - 20 * Math.sin(angle - arrowAngle)}
          ${toX - 20 * Math.cos(angle + arrowAngle)},${toY - 20 * Math.sin(angle + arrowAngle)}
        `}
        fill={isOutgoing ? "#60a5fa" : "#f472b6"}
        fillOpacity={0.6}
      />
      
      {/* Import names label */}
      {importNames.length > 0 && (
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          className="fill-slate-400 text-[10px]"
        >
          {importNames.slice(0, 2).join(", ")}
          {importNames.length > 2 && ` +${importNames.length - 2}`}
        </text>
      )}
    </g>
  );
}

export default function BridgeView({ data, onClose, onNodeClick }: BridgeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate positions
  const positions = useMemo(() => {
    return calculateNodePositions(
      data.sourceFile,
      data.dependencies,
      data.dependents,
      dimensions.width,
      dimensions.height
    );
  }, [data, dimensions]);

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setLastPointer({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning || !lastPointer) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    setLastPointer({ x: e.clientX, y: e.clientY });
    setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, [isPanning, lastPointer]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setLastPointer(null);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.001);
    const newScale = Math.max(0.3, Math.min(3, view.scale * factor));
    setView(prev => ({ ...prev, scale: newScale }));
  }, [view.scale]);

  const handleZoomIn = () => setView(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }));
  const handleZoomOut = () => setView(prev => ({ ...prev, scale: Math.max(0.3, prev.scale / 1.2) }));
  const handleFitView = () => setView({ x: 0, y: 0, scale: 1 });

  // Get import names for a dependency
  const getImportNames = (targetPath: string): string[] => {
    const link = data.sourceFile.dependencies.find(d => d.targetPath === targetPath);
    return link?.importNames || [];
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Bridge - Dependency Graph</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="rounded bg-slate-800 px-2 py-0.5">
              {data.totalNodes} nodes
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5">
              {data.totalEdges} connections
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-sm text-slate-400">{Math.round(view.scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={handleFitView}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Fit view"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <div className="mx-2 h-6 w-px bg-slate-700" />
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-4 py-2">
        <span className="text-xs text-slate-500">Legend:</span>
        <div className="flex items-center gap-1 text-xs">
          <ArrowRight className="h-3 w-3 text-blue-400" />
          <span className="text-slate-400">Dependencies (imports)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <ArrowLeft className="h-3 w-3 text-pink-400" />
          <span className="text-slate-400">Dependents (imported by)</span>
        </div>
        <div className="mx-2 h-4 w-px bg-slate-700" />
        {Object.entries(nodeTypeConfig).slice(0, 5).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1 text-xs">
            <span className={config.color}>{config.icon}</span>
            <span className="text-slate-400 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Main canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,116,139,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,116,139,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        />

        {/* SVG canvas */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: `${dimensions.width / 2}px ${dimensions.height / 2}px`,
          }}
        >
          {/* Edges from source to dependencies */}
          {data.dependencies.map((dep) => {
            const sourcePos = positions.get(data.sourceFile.path);
            const targetPos = positions.get(dep.path);
            if (!sourcePos || !targetPos) return null;

            return (
              <BridgeEdge
                key={`edge-out-${dep.path}`}
                fromX={sourcePos.x}
                fromY={sourcePos.y}
                toX={targetPos.x}
                toY={targetPos.y}
                isOutgoing={true}
                importNames={getImportNames(dep.path)}
              />
            );
          })}

          {/* Edges from dependents to source */}
          {data.dependents.map((dep) => {
            const sourcePos = positions.get(data.sourceFile.path);
            const targetPos = positions.get(dep.path);
            if (!sourcePos || !targetPos) return null;

            return (
              <BridgeEdge
                key={`edge-in-${dep.path}`}
                fromX={targetPos.x}
                fromY={targetPos.y}
                toX={sourcePos.x}
                toY={sourcePos.y}
                isOutgoing={false}
                importNames={[]}
              />
            );
          })}

          {/* Source node */}
          {(() => {
            const pos = positions.get(data.sourceFile.path);
            if (!pos) return null;
            return (
              <BridgeNode
                key={data.sourceFile.path}
                node={data.sourceFile}
                x={pos.x}
                y={pos.y}
                isSource={true}
                onClick={() => setSelectedNode(data.sourceFile)}
              />
            );
          })()}

          {/* Dependency nodes */}
          {data.dependencies.map((dep) => {
            const pos = positions.get(dep.path);
            if (!pos) return null;
            return (
              <BridgeNode
                key={dep.path}
                node={dep}
                x={pos.x}
                y={pos.y}
                isSource={false}
                onClick={() => {
                  setSelectedNode(dep);
                  if (dep.type !== "external" && onNodeClick) {
                    onNodeClick(dep.path);
                  }
                }}
              />
            );
          })}

          {/* Dependent nodes */}
          {data.dependents.map((dep) => {
            const pos = positions.get(dep.path);
            if (!pos) return null;
            return (
              <BridgeNode
                key={dep.path}
                node={dep}
                x={pos.x}
                y={pos.y}
                isSource={false}
                onClick={() => {
                  setSelectedNode(dep);
                  if (onNodeClick) {
                    onNodeClick(dep.path);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Empty state */}
        {data.dependencies.length === 0 && data.dependents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <File className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-2">No dependencies found</p>
              <p className="text-sm text-slate-500">
                This file doesn&apos;t import any other files and isn&apos;t imported by any files.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="absolute right-4 top-32 w-72 rounded-lg border border-slate-700 bg-slate-900/95 p-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={nodeTypeConfig[selectedNode.type].color}>
                {nodeTypeConfig[selectedNode.type].icon}
              </span>
              <h3 className="font-medium text-white">{selectedNode.name}</h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Path:</span>
              <p className="break-all text-slate-300">{selectedNode.path}</p>
            </div>
            <div>
              <span className="text-slate-500">Type:</span>
              <span className="ml-2 capitalize text-slate-300">{selectedNode.type}</span>
            </div>
            <div>
              <span className="text-slate-500">Importance:</span>
              <span className="ml-2 text-slate-300">{selectedNode.importance}</span>
            </div>
            {selectedNode.exports.length > 0 && (
              <div>
                <span className="text-slate-500">Exports:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedNode.exports.slice(0, 8).map((exp) => (
                    <span
                      key={exp}
                      className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300"
                    >
                      {exp}
                    </span>
                  ))}
                  {selectedNode.exports.length > 8 && (
                    <span className="text-xs text-slate-500">
                      +{selectedNode.exports.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedNode.type !== "external" && onNodeClick && (
            <button
              onClick={() => onNodeClick(selectedNode.path)}
              className="mt-4 w-full rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Open File
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Loading state component
export function BridgeLoading() {
  const [dots, setDots] = useState("");
  const [step, setStep] = useState(0);
  
  const steps = [
    "Fetching repository files",
    "Analyzing imports and exports",
    "Building dependency graph",
    "Calculating importance scores",
  ];

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 400);
    
    const stepInterval = setInterval(() => {
      setStep(prev => (prev + 1) % 4);
    }, 2000);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-blue-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        </div>
        
        <h2 className="mt-6 text-xl font-semibold text-white">
          Analyzing Dependencies{dots}
        </h2>
        
        <p className="mt-2 text-sm text-slate-400">
          {steps[step]}
        </p>
        
        {/* Progress dots */}
        <div className="mt-4 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === step ? "bg-blue-500 scale-125" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
        
        <p className="mt-6 text-xs text-slate-500">
          This may take a moment for large repositories
        </p>
      </div>
    </div>
  );
}
