"use client";

import React from "react";
import type { BridgeNode, BridgeData } from "@/types/bridge";
import { getImportanceColor, getImpactLabel, getFileIcon } from "./utils";

interface BridgeInfoPanelProps {
  selectedNode: BridgeNode | null;
  bridgeData: BridgeData;
  onClose: () => void;
}

export const BridgeInfoPanel: React.FC<BridgeInfoPanelProps> = ({
  selectedNode,
  bridgeData,
  onClose,
}) => {
  if (!selectedNode) return null;

  const dependency = bridgeData.dependencies.find((d) => d.path === selectedNode.path);
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
        </button>
      </div>

      {dependency && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${importanceColors.badge}`}
            >
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
