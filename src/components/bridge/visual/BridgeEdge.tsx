"use client";

import React from "react";
import type { BridgeEdge } from "@/types/bridge";
import { getImportanceColor } from "./utils";

interface BridgeEdgeSVGProps {
  edge: BridgeEdge;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isHighlighted?: boolean;
}

export const BridgeEdgeSVG: React.FC<BridgeEdgeSVGProps> = ({
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
