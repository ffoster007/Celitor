"use client";

import React from "react";
import type { BridgeData } from "@/types/bridge";

interface BridgeStatsProps {
  metadata: BridgeData["metadata"];
}

export const BridgeStats: React.FC<BridgeStatsProps> = ({ metadata }) => {
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
