import React from "react";
import {
  FileCode,
  FileJson,
  FileType,
  Palette,
  ImageIcon,
  Settings,
  Server,
  ArrowRight,
  Box,
} from "lucide-react";
import type { DependencyType, DependencyImportance } from "@/types/bridge";

export const getImpactLabel = (importance: DependencyImportance) => {
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

export const getImportanceColor = (importance: DependencyImportance) => {
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

export const getTypeIcon = (type: DependencyType, className: string = "h-4 w-4") => {
  switch (type) {
    case "component":
      return React.createElement(Box, { className });
    case "import":
      return React.createElement(FileCode, { className });
    case "function":
      return React.createElement(FileCode, { className });
    case "export":
      return React.createElement(ArrowRight, { className });
    case "type":
      return React.createElement(FileType, { className });
    case "style":
      return React.createElement(Palette, { className });
    case "asset":
      return React.createElement(ImageIcon, { className });
    case "config":
      return React.createElement(Settings, { className });
    case "api":
      return React.createElement(Server, { className });
    default:
      return React.createElement(FileCode, { className });
  }
};

export const getFileIcon = (extension: string, className: string = "h-5 w-5") => {
  const ext = extension.toLowerCase();

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    return React.createElement(FileCode, { className: `${className} text-blue-400` });
  }
  if ([".json", ".yaml", ".yml"].includes(ext)) {
    return React.createElement(FileJson, { className: `${className} text-yellow-400` });
  }
  if ([".css", ".scss", ".sass", ".less"].includes(ext)) {
    return React.createElement(Palette, { className: `${className} text-pink-400` });
  }
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"].includes(ext)) {
    return React.createElement(ImageIcon, { className: `${className} text-green-400` });
  }

  return React.createElement(FileCode, { className: `${className} text-slate-400` });
};
