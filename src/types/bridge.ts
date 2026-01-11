// Bridge System Types - File Dependency Visualization

export type DependencyType = 
  | "import"        // ES6 import / CommonJS require
  | "export"        // Re-exports from another file
  | "component"     // React component usage
  | "function"      // Function call from another file
  | "type"          // TypeScript type import
  | "style"         // CSS/SCSS/Style import
  | "asset"         // Asset import (images, fonts, etc.)
  | "config"        // Config file reference
  | "api"           // API route reference
  | "unknown";

export type DependencyImportance = "critical" | "high" | "medium" | "low";

export interface FileDependency {
  /** Path of the dependent file */
  path: string;
  /** Display name of the file */
  name: string;
  /** Type of dependency relationship */
  type: DependencyType;
  /** Importance level (calculated based on frequency and type) */
  importance: DependencyImportance;
  /** Number of times this dependency is referenced */
  referenceCount: number;
  /** Specific imports/exports from this file */
  symbols: string[];
  /** Line numbers where references occur */
  lineNumbers: number[];
  /** Whether this file also depends on the source file (bi-directional) */
  isBidirectional: boolean;
  /** File extension for icon display */
  extension: string;
}

export interface BridgeNode {
  /** Unique identifier */
  id: string;
  /** File path */
  path: string;
  /** Display name */
  name: string;
  /** File extension */
  extension: string;
  /** Position in the visualization */
  position: { x: number; y: number };
  /** Node type: source is the analyzed file, dependency is a connected file */
  nodeType: "source" | "dependency";
  /** Importance level for visual styling */
  importance: DependencyImportance;
  /** If dependency, what types of connections */
  dependencyTypes: DependencyType[];
  /** Reference count for sizing */
  referenceCount: number;
}

export interface BridgeEdge {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of connection */
  type: DependencyType;
  /** Label showing what's being imported/used */
  label: string;
  /** Is this a bidirectional edge */
  bidirectional: boolean;
  /** Importance for edge styling */
  importance: DependencyImportance;
}

export interface BridgeData {
  /** The source file being analyzed */
  sourceFile: {
    path: string;
    name: string;
    extension: string;
  };
  /** All dependencies found */
  dependencies: FileDependency[];
  /** Pre-computed nodes for visualization */
  nodes: BridgeNode[];
  /** Pre-computed edges for visualization */
  edges: BridgeEdge[];
  /** Analysis metadata */
  metadata: {
    analyzedAt: string;
    totalDependencies: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export interface BridgeAnalysisRequest {
  owner: string;
  repo: string;
  filePath: string;
}

export interface BridgeAnalysisResponse {
  success: boolean;
  data?: BridgeData;
  error?: string;
}

// Context menu state
export interface FileContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  filePath: string;
  fileName: string;
}
