"use client";

import React from "react";
import { ArrowLeftRight } from "lucide-react";
import type { DependencyImportance, DependencyType } from "@/types/bridge";
import { getImportanceColor, getImpactLabel, getTypeIcon } from "./utils";

export const BridgeLegend: React.FC = () => {
  const importanceLevels: DependencyImportance[] = ["critical", "high", "medium", "low"];
  const typeList: DependencyType[] = ["component", "import", "type", "style", "api", "config"];

  return (
    <div className="absolute top-4 right-4 border border-white/80 bg-[#000000] p-4">
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
