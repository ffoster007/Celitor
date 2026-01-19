"use client";

import React from "react";
import { Box, Dot } from "lucide-react";
import type { BridgeNode } from "@/types/bridge";
import { getImportanceColor, getImpactLabel, getFileIcon } from "./utils";

interface BridgeNodeComponentProps {
  node: BridgeNode;
  position: { x: number; y: number };
  isSource?: boolean;
  onClick?: (node: BridgeNode) => void;
  isSelected?: boolean;
  onHover?: (nodeId: string | null) => void;
}

export const BridgeNodeComponent: React.FC<BridgeNodeComponentProps> = ({
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
