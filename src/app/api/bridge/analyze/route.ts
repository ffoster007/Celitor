import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Types for Bridge analysis
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

export interface BridgeResponse {
  sourceFile: DependencyNode;
  dependencies: DependencyNode[];
  dependents: DependencyNode[];
  totalNodes: number;
  totalEdges: number;
}

// Language detection
function getLanguage(filePath: string): string {
  const ext = filePath.toLowerCase();
  if (ext.endsWith(".ts") || ext.endsWith(".tsx")) return "typescript";
  if (ext.endsWith(".js") || ext.endsWith(".jsx") || ext.endsWith(".mjs")) return "javascript";
  if (ext.endsWith(".py")) return "python";
  if (ext.endsWith(".go")) return "go";
  if (ext.endsWith(".rs")) return "rust";
  if (ext.endsWith(".css") || ext.endsWith(".scss") || ext.endsWith(".sass")) return "css";
  if (ext.endsWith(".json")) return "json";
  return "unknown";
}

// Extract imports from TypeScript/JavaScript
function extractTSImports(content: string): { path: string; type: string; names: string[]; line: number }[] {
  const imports: { path: string; type: string; names: string[]; line: number }[] = [];
  const lines = content.split("\n");

  const importPatterns = [
    // ES6 imports: import X from 'path', import { X } from 'path', import X, { Y } from 'path'
    /^import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*from\s*['"]([^'"]+)['"]/,
    // Namespace import: import * as X from 'path'
    /^import\s+\*\s+as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/,
    // Side-effect import: import 'path'
    /^import\s+['"]([^'"]+)['"]/,
  ];

  const dynamicImportPattern = /import\(['"]([^'"]+)['"]\)/g;
  const requirePattern = /require\(['"]([^'"]+)['"]\)/g;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Standard imports
    for (const pattern of importPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        if (match.length >= 4 && match[3]) {
          // import X, { Y } from 'path'
          const names: string[] = [];
          if (match[1]) names.push(match[1]);
          if (match[2]) {
            match[2].split(",").forEach(n => {
              const name = n.trim().split(/\s+as\s+/)[0].trim();
              if (name) names.push(name);
            });
          }
          imports.push({
            path: match[3],
            type: match[1] ? "default" : "named",
            names,
            line: index + 1,
          });
        } else if (match.length >= 3 && match[2] && !match[3]) {
          // import * as X from 'path'
          imports.push({
            path: match[2],
            type: "namespace",
            names: [match[1]],
            line: index + 1,
          });
        } else if (match.length >= 2 && match[1] && !match[2]) {
          // import 'path'
          imports.push({
            path: match[1],
            type: "sideEffect",
            names: [],
            line: index + 1,
          });
        }
        break;
      }
    }

    // Dynamic imports
    let dynamicMatch;
    while ((dynamicMatch = dynamicImportPattern.exec(line)) !== null) {
      imports.push({
        path: dynamicMatch[1],
        type: "sideEffect",
        names: [],
        line: index + 1,
      });
    }

    // Require
    let requireMatch;
    while ((requireMatch = requirePattern.exec(line)) !== null) {
      imports.push({
        path: requireMatch[1],
        type: "default",
        names: [],
        line: index + 1,
      });
    }
  });

  return imports;
}

// Extract exports from TypeScript/JavaScript
function extractTSExports(content: string): string[] {
  const exports: string[] = [];
  const seen = new Set<string>();

  const exportPatterns = [
    /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/gm,
    /^export\s+\{([^}]+)\}/gm,
  ];

  for (const pattern of exportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        const names = match[1].split(",");
        names.forEach(name => {
          const cleanName = name.trim().split(/\s+as\s+/)[0].trim();
          if (cleanName && !seen.has(cleanName)) {
            exports.push(cleanName);
            seen.add(cleanName);
          }
        });
      }
    }
  }

  // Check for default export
  if (/^export\s+default/m.test(content) && !seen.has("default")) {
    exports.push("default");
  }

  return exports;
}

// Check if import is external
function isExternalDependency(path: string): boolean {
  return !path.startsWith(".") && !path.startsWith("@/") && !path.startsWith("~/");
}

// Get file name from path
function getFileName(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

// Get file type from path
function getFileType(path: string): DependencyNode["type"] {
  const name = getFileName(path);
  
  if (path.includes("/components/")) return "component";
  if (path.includes("/lib/") || path.includes("/utils/")) return "utility";
  if (path.includes("/types/")) return "type";
  if (path.includes("/api/")) return "api";
  if (path.includes("/app/") && (name.endsWith("page.tsx") || name.endsWith("page.ts"))) return "page";
  if (name.endsWith(".config.ts") || name.endsWith(".config.js") || name.endsWith(".json")) return "config";
  if (name.endsWith(".css") || name.endsWith(".scss")) return "style";
  return "file";
}

// Resolve import path to actual file path
function resolveImportPath(
  sourcePath: string,
  importPath: string,
  repoFiles: Map<string, string>
): string {
  if (isExternalDependency(importPath)) {
    return importPath;
  }

  // Handle alias imports (@/)
  let resolved = importPath;
  if (importPath.startsWith("@/")) {
    resolved = "src/" + importPath.slice(2);
  }

  // Get source directory
  const sourceDir = sourcePath.includes("/") 
    ? sourcePath.slice(0, sourcePath.lastIndexOf("/"))
    : "";

  // Resolve relative paths
  if (resolved.startsWith("./")) {
    resolved = sourceDir + "/" + resolved.slice(2);
  } else if (resolved.startsWith("../")) {
    const parts = sourceDir.split("/");
    const importParts = resolved.split("/");
    
    let upCount = 0;
    for (const p of importParts) {
      if (p === "..") upCount++;
      else break;
    }
    
    if (upCount <= parts.length) {
      const remaining = parts.slice(0, parts.length - upCount);
      resolved = [...remaining, ...importParts.slice(upCount)].join("/");
    }
  }

  // Clean path
  resolved = resolved.replace(/\/\//g, "/").replace(/^\//, "");

  // Try to find actual file
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
  for (const ext of extensions) {
    const testPath = resolved + ext;
    if (repoFiles.has(testPath)) {
      return testPath;
    }
  }

  return resolved;
}

// Calculate importance based on how many files depend on this one
function calculateImportance(
  nodePath: string,
  exports: string[],
  allDeps: Map<string, string[]>
): number {
  let importance = 0;

  // Count incoming dependencies
  for (const [, deps] of allDeps) {
    for (const dep of deps) {
      if (dep === nodePath) {
        importance += 10;
      }
    }
  }

  // Add importance based on exports
  importance += exports.length * 2;

  // Add importance based on file type
  if (nodePath.includes("/lib/") || nodePath.includes("/utils/")) {
    importance += 5;
  } else if (nodePath.includes("/components/")) {
    importance += 3;
  } else if (nodePath.includes("/types/")) {
    importance += 4;
  }

  return importance;
}

// Main analysis function
async function analyzeBridge(
  filePath: string,
  fileContent: string,
  repoFiles: Map<string, string>
): Promise<BridgeResponse> {
  const language = getLanguage(filePath);
  
  // Extract imports and exports from source file
  const sourceImports = extractTSImports(fileContent);
  const sourceExports = extractTSExports(fileContent);

  // Build dependency map for all files
  const allDeps = new Map<string, string[]>();
  const allNodes = new Map<string, DependencyNode>();

  // Analyze all repo files
  for (const [path, content] of repoFiles) {
    const fileLang = getLanguage(path);
    if (fileLang !== "typescript" && fileLang !== "javascript") continue;

    const imports = extractTSImports(content);
    const exports = extractTSExports(content);

    const dependencies: DependencyLink[] = [];
    const depPaths: string[] = [];

    for (const imp of imports) {
      const resolvedPath = resolveImportPath(path, imp.path, repoFiles);
      depPaths.push(resolvedPath);
      dependencies.push({
        targetPath: resolvedPath,
        importType: imp.type as DependencyLink["importType"],
        importNames: imp.names,
        lineNumber: imp.line,
        isExternal: isExternalDependency(imp.path),
      });
    }

    allDeps.set(path, depPaths);
    allNodes.set(path, {
      path,
      name: getFileName(path),
      type: getFileType(path),
      importance: 0,
      dependencies,
      exports,
      language: fileLang,
    });
  }

  // Calculate importance for all nodes
  for (const [path, node] of allNodes) {
    node.importance = calculateImportance(path, node.exports, allDeps);
  }

  // Build source node
  const sourceDependencies: DependencyLink[] = [];
  const dependencies: DependencyNode[] = [];
  const seenDeps = new Set<string>();

  for (const imp of sourceImports) {
    const resolvedPath = resolveImportPath(filePath, imp.path, repoFiles);
    
    if (seenDeps.has(resolvedPath)) continue;
    seenDeps.add(resolvedPath);

    sourceDependencies.push({
      targetPath: resolvedPath,
      importType: imp.type as DependencyLink["importType"],
      importNames: imp.names,
      lineNumber: imp.line,
      isExternal: isExternalDependency(imp.path),
    });

    const existingNode = allNodes.get(resolvedPath);
    if (existingNode) {
      dependencies.push(existingNode);
    } else {
      // External or unresolved
      dependencies.push({
        path: resolvedPath,
        name: getFileName(resolvedPath),
        type: "external",
        importance: 0,
        dependencies: [],
        exports: [],
        language,
      });
    }
  }

  // Find dependents (files that import the source)
  const dependents: DependencyNode[] = [];
  const seenDependents = new Set<string>();

  for (const [path, deps] of allDeps) {
    if (path === filePath) continue;
    
    for (const dep of deps) {
      if (dep === filePath && !seenDependents.has(path)) {
        seenDependents.add(path);
        const node = allNodes.get(path);
        if (node) {
          dependents.push(node);
        }
        break;
      }
    }
  }

  // Sort by importance
  dependencies.sort((a, b) => b.importance - a.importance);
  dependents.sort((a, b) => b.importance - a.importance);

  const sourceNode: DependencyNode = {
    path: filePath,
    name: getFileName(filePath),
    type: getFileType(filePath),
    importance: calculateImportance(filePath, sourceExports, allDeps),
    dependencies: sourceDependencies,
    exports: sourceExports,
    language,
  };

  return {
    sourceFile: sourceNode,
    dependencies,
    dependents,
    totalNodes: dependencies.length + dependents.length + 1,
    totalEdges: dependencies.length + dependents.length,
  };
}

// Fetch all files from repository recursively
async function fetchAllRepoFiles(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  
  const fetchDir = async (dirPath: string) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) return;

    const contents = await response.json();
    if (!Array.isArray(contents)) return;

    const promises: Promise<void>[] = [];

    for (const item of contents) {
      if (item.type === "dir") {
        // Skip common non-code directories
        if (["node_modules", ".git", ".next", "dist", "build", ".cache"].includes(item.name)) {
          continue;
        }
        promises.push(fetchDir(item.path));
      } else if (item.type === "file") {
        // Only fetch code files
        const ext = item.name.split(".").pop()?.toLowerCase();
        if (["ts", "tsx", "js", "jsx", "mjs", "py", "go", "rs"].includes(ext || "")) {
          promises.push(
            fetch(item.download_url)
              .then(r => r.text())
              .then(content => {
                files.set(item.path, content);
              })
              .catch(() => {})
          );
        }
      }
    }

    await Promise.all(promises);
  };

  await fetchDir(path);
  return files;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { filePath, owner, repo } = body;

    if (!filePath || !owner || !repo) {
      return NextResponse.json(
        { error: "Missing required parameters: filePath, owner, repo" },
        { status: 400 }
      );
    }

    // Fetch all repository files
    const repoFiles = await fetchAllRepoFiles(
      session.user.accessToken,
      owner,
      repo
    );

    // Get the content of the target file
    const fileContent = repoFiles.get(filePath);
    if (!fileContent) {
      return NextResponse.json(
        { error: "File not found in repository" },
        { status: 404 }
      );
    }

    // Analyze dependencies
    const response = await analyzeBridge(filePath, fileContent, repoFiles);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bridge analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file dependencies" },
      { status: 500 }
    );
  }
}
