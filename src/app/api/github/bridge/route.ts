import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { fetchFileContent, fetchRepoContents } from "@/lib/github";
import { analyzeWithRustBackend, checkRustBackendHealth } from "@/lib/rust-api";
import type { 
  BridgeData, 
  FileDependency, 
  DependencyType, 
  DependencyImportance,
  BridgeNode,
  BridgeEdge 
} from "@/types/bridge";

// Use Rust backend for high-performance analysis (Railway.app hosted)
const USE_RUST_BACKEND = process.env.USE_RUST_BACKEND !== "false";

// File extensions that can have dependencies (extended for multi-language support)
const ANALYZABLE_EXTENSIONS = [
  // JavaScript/TypeScript
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  // Frontend frameworks
  ".vue", ".svelte", ".astro",
  // Python
  ".py", ".pyw", ".pyi",
  // Rust
  ".rs",
  // Go
  ".go",
  // Java/Kotlin
  ".java", ".kt", ".kts",
  // C#
  ".cs",
  // C/C++
  ".c", ".cpp", ".cxx", ".cc", ".h", ".hpp", ".hxx", ".hh",
  // Ruby
  ".rb", ".rake",
  // PHP
  ".php", ".phtml",
  // Styles
  ".css", ".scss", ".sass", ".less",
  // Config
  ".json", ".yaml", ".yml", ".toml"
];

// Import pattern regex for various file types
const IMPORT_PATTERNS = {
  // ES6 imports: import X from 'path', import { X } from 'path', import * as X from 'path'
  es6Import: /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g,
  
  // ES6 dynamic import: import('path')
  dynamicImport: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  
  // CommonJS require: require('path')
  commonjsRequire: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  
  // CSS imports: @import 'path'
  cssImport: /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"](?:\s*\))?/g,
  
  // TypeScript type imports: import type { X } from 'path'
  typeImport: /import\s+type\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
  
  // Export from: export { X } from 'path', export * from 'path'
  exportFrom: /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g,
};

// Extract symbols from import statement
const SYMBOL_PATTERNS = {
  namedImports: /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
  defaultImport: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
  namespaceImport: /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
};

function getFileExtension(path: string): string {
  const match = path.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

function resolveImportPath(
  importPath: string, 
  currentFilePath: string, 
  availableFiles: string[]
): string | null {
  // Skip node_modules and external packages
  if (!importPath.startsWith(".") && !importPath.startsWith("/") && !importPath.startsWith("@/")) {
    return null;
  }

  let resolvedPath = importPath;

  // Handle alias paths like @/
  if (importPath.startsWith("@/")) {
    resolvedPath = importPath.replace("@/", "src/");
  } 
  // Handle relative paths
  else if (importPath.startsWith(".")) {
    const currentDir = currentFilePath.split("/").slice(0, -1).join("/");
    const parts = importPath.split("/");
    const dirParts = currentDir.split("/");
    
    for (const part of parts) {
      if (part === "..") {
        dirParts.pop();
      } else if (part !== ".") {
        dirParts.push(part);
      }
    }
    resolvedPath = dirParts.join("/");
  }

  // Try to find the actual file
  const possibleExtensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
  
  for (const ext of possibleExtensions) {
    const fullPath = resolvedPath + ext;
    if (availableFiles.includes(fullPath)) {
      return fullPath;
    }
  }

  // Try without src/ prefix
  if (resolvedPath.startsWith("src/")) {
    const withoutSrc = resolvedPath.substring(4);
    for (const ext of possibleExtensions) {
      const fullPath = withoutSrc + ext;
      if (availableFiles.includes(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

function extractSymbols(content: string, importPath: string): string[] {
  const symbols: string[] = [];
  
  // Reset regex lastIndex
  SYMBOL_PATTERNS.namedImports.lastIndex = 0;
  SYMBOL_PATTERNS.defaultImport.lastIndex = 0;
  SYMBOL_PATTERNS.namespaceImport.lastIndex = 0;

  let match;
  
  // Named imports
  while ((match = SYMBOL_PATTERNS.namedImports.exec(content)) !== null) {
    if (match[2] === importPath) {
      const namedSymbols = match[1].split(",").map(s => s.trim().split(" as ")[0].trim());
      symbols.push(...namedSymbols);
    }
  }
  
  // Default imports
  SYMBOL_PATTERNS.defaultImport.lastIndex = 0;
  while ((match = SYMBOL_PATTERNS.defaultImport.exec(content)) !== null) {
    if (match[2] === importPath) {
      symbols.push(match[1]);
    }
  }
  
  // Namespace imports
  SYMBOL_PATTERNS.namespaceImport.lastIndex = 0;
  while ((match = SYMBOL_PATTERNS.namespaceImport.exec(content)) !== null) {
    if (match[2] === importPath) {
      symbols.push(`* as ${match[1]}`);
    }
  }

  return [...new Set(symbols)];
}

function getLineNumbers(content: string, importPath: string): number[] {
  const lines = content.split("\n");
  const lineNumbers: number[] = [];
  
  lines.forEach((line, index) => {
    if (line.includes(`'${importPath}'`) || line.includes(`"${importPath}"`)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

function getDependencyType(importPath: string, symbols: string[]): DependencyType {
  const ext = getFileExtension(importPath);
  
  if ([".css", ".scss", ".sass", ".less"].includes(ext)) {
    return "style";
  }
  
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"].includes(ext)) {
    return "asset";
  }
  
  if ([".json", ".yaml", ".yml"].includes(ext)) {
    return "config";
  }
  
  if (importPath.includes("/api/")) {
    return "api";
  }
  
  // Check if it's a type-only import
  if (symbols.some(s => s.startsWith("type ") || s.includes("Type") || s.includes("Interface"))) {
    return "type";
  }
  
  // Check if importing React components (starts with uppercase)
  if (symbols.some(s => /^[A-Z]/.test(s) && !s.includes("Type") && !s.includes("Interface"))) {
    return "component";
  }
  
  return "import";
}

function calculateImportance(
  type: DependencyType, 
  referenceCount: number,
  isBidirectional: boolean
): DependencyImportance {
  let score = 0;
  
  // Type weights
  const typeWeights: Record<DependencyType, number> = {
    component: 4,
    import: 3,
    function: 3,
    export: 3,
    type: 2,
    api: 2,
    style: 1,
    asset: 1,
    config: 1,
    unknown: 0,
  };
  
  score += typeWeights[type];
  
  // Reference count bonus
  if (referenceCount >= 5) score += 3;
  else if (referenceCount >= 3) score += 2;
  else if (referenceCount >= 2) score += 1;
  
  // Bidirectional bonus (tightly coupled)
  if (isBidirectional) score += 2;
  
  if (score >= 7) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

async function getAllRepoFiles(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const contents = await fetchRepoContents(accessToken, owner, repo, path);
    
    for (const item of contents) {
      if (item.type === "file") {
        files.push(item.path);
      } else if (item.type === "dir" && !item.name.startsWith(".") && item.name !== "node_modules") {
        const subFiles = await getAllRepoFiles(accessToken, owner, repo, item.path);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error fetching contents for ${path}:`, error);
  }
  
  return files;
}

function createBridgeNodes(
  sourceFile: { path: string; name: string; extension: string },
  dependencies: FileDependency[]
): BridgeNode[] {
  const nodes: BridgeNode[] = [];
  
  // Add source node at center
  nodes.push({
    id: "source",
    path: sourceFile.path,
    name: sourceFile.name,
    extension: sourceFile.extension,
    position: { x: 0, y: 0 },
    nodeType: "source",
    importance: "critical",
    dependencyTypes: [],
    referenceCount: 0,
  });
  
  // Structured layout:
  // - Source is centered at (0,0)
  // - Dependencies are placed in importance lanes from left-to-right:
  //   Core (critical) → Important (high) → Related (medium) → Peripheral (low)
  // - Within a lane, nodes are stacked vertically and wrap into additional columns.

  const order: DependencyImportance[] = ["critical", "high", "medium", "low"];
  const laneX: Record<DependencyImportance, number> = {
    critical: 420,
    high: 760,
    medium: 1080,
    low: 1400,
  };

  const laneIndices: Record<DependencyImportance, number[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  dependencies.forEach((dep, index) => {
    laneIndices[dep.importance].push(index);
  });

  // Order nodes within each lane by referenceCount (desc), then name (asc)
  for (const level of order) {
    laneIndices[level].sort((a, b) => {
      const da = dependencies[a];
      const db = dependencies[b];
      if (db.referenceCount !== da.referenceCount) return db.referenceCount - da.referenceCount;
      return da.name.localeCompare(db.name);
    });
  }

  const rowGap = 92;
  const colGap = 220;
  const maxRowsPerColumn = 10;

  for (const level of order) {
    const indices = laneIndices[level];
    const laneBaseX = laneX[level];
    const columns = Math.max(1, Math.ceil(indices.length / maxRowsPerColumn));

    for (let j = 0; j < indices.length; j++) {
      const depIndex = indices[j];
      const dep = dependencies[depIndex];

      const col = Math.floor(j / maxRowsPerColumn);
      const row = j % maxRowsPerColumn;

      const rowsInThisCol =
        col === columns - 1
          ? indices.length - col * maxRowsPerColumn
          : maxRowsPerColumn;

      const y0 = -((rowsInThisCol - 1) * rowGap) / 2;
      const x = laneBaseX + col * colGap;
      const y = y0 + row * rowGap;

      nodes.push({
        id: `dep-${depIndex}`,
        path: dep.path,
        name: dep.name,
        extension: dep.extension,
        position: { x, y },
        nodeType: "dependency",
        importance: dep.importance,
        dependencyTypes: [dep.type],
        referenceCount: dep.referenceCount,
      });
    }
  }
  
  return nodes;
}

function createBridgeEdges(
  dependencies: FileDependency[]
): BridgeEdge[] {
  return dependencies.map((dep, index) => ({
    id: `edge-${index}`,
    source: "source",
    target: `dep-${index}`,
    type: dep.type,
    label: dep.symbols.slice(0, 3).join(", ") + (dep.symbols.length > 3 ? "..." : ""),
    bidirectional: dep.isBidirectional,
    importance: dep.importance,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, filePath } = await request.json();

    if (!owner || !repo || !filePath) {
      return NextResponse.json(
        { error: "Missing owner, repo, or filePath parameter" },
        { status: 400 }
      );
    }

    const extension = getFileExtension(filePath);
    if (!ANALYZABLE_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `File type ${extension} is not supported for analysis` },
        { status: 400 }
      );
    }

    // Try Rust backend first for high-performance analysis
    if (USE_RUST_BACKEND) {
      const isRustAvailable = await checkRustBackendHealth();
      
      if (isRustAvailable) {
        console.log("[Bridge] Using Rust backend for analysis");
        const rustResult = await analyzeWithRustBackend({
          owner,
          repo,
          filePath,
          accessToken: session.user.accessToken,
        });

        if (rustResult.success && rustResult.data) {
          return NextResponse.json(rustResult);
        }
        
        // Log error but fall through to TypeScript fallback
        console.warn("[Bridge] Rust backend failed, falling back to TypeScript:", rustResult.error);
      } else {
        console.log("[Bridge] Rust backend unavailable, using TypeScript fallback");
      }
    }

    // Fallback to TypeScript implementation (for JS/TS files only)
    console.log("[Bridge] Using TypeScript fallback implementation");

    // Fetch the source file content
    const fileContent = await fetchFileContent(
      session.user.accessToken,
      owner,
      repo,
      filePath
    );

    // Get all files in the repository (limited depth for performance)
    const allFiles = await getAllRepoFiles(session.user.accessToken, owner, repo);

    // Find all imports in the file
    const importPaths: Map<string, { originalPath: string; count: number; lines: number[] }> = new Map();
    
    // Reset all regex lastIndex
    Object.values(IMPORT_PATTERNS).forEach(regex => regex.lastIndex = 0);

    for (const [, pattern] of Object.entries(IMPORT_PATTERNS)) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(fileContent)) !== null) {
        const importPath = match[1];
        const resolvedPath = resolveImportPath(importPath, filePath, allFiles);
        
        if (resolvedPath) {
          const existing = importPaths.get(resolvedPath);
          const lineNumbers = getLineNumbers(fileContent, importPath);
          
          if (existing) {
            existing.count++;
            existing.lines.push(...lineNumbers);
          } else {
            importPaths.set(resolvedPath, {
              originalPath: importPath,
              count: 1,
              lines: lineNumbers,
            });
          }
        }
      }
    }

    // Build dependency list
    const dependencies: FileDependency[] = [];
    
    for (const [resolvedPath, info] of importPaths) {
      const symbols = extractSymbols(fileContent, info.originalPath);
      const type = getDependencyType(resolvedPath, symbols);
      
      // Check for bidirectional dependency
      let isBidirectional = false;
      try {
        const depContent = await fetchFileContent(
          session.user.accessToken,
          owner,
          repo,
          resolvedPath
        );
        
        // Check if the dependency imports the source file
        for (const pattern of Object.values(IMPORT_PATTERNS)) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(depContent)) !== null) {
            const depImportPath = match[1];
            const resolved = resolveImportPath(depImportPath, resolvedPath, allFiles);
            if (resolved === filePath) {
              isBidirectional = true;
              break;
            }
          }
          if (isBidirectional) break;
        }
      } catch {
        // Ignore errors when checking bidirectional
      }

      const importance = calculateImportance(type, info.count, isBidirectional);

      dependencies.push({
        path: resolvedPath,
        name: getFileName(resolvedPath),
        type,
        importance,
        referenceCount: info.count,
        symbols,
        lineNumbers: [...new Set(info.lines)],
        isBidirectional,
        extension: getFileExtension(resolvedPath),
      });
    }

    // Sort by importance
    dependencies.sort((a, b) => {
      const order: Record<DependencyImportance, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.importance] - order[b.importance];
    });

    const sourceFile = {
      path: filePath,
      name: getFileName(filePath),
      extension,
    };

    const nodes = createBridgeNodes(sourceFile, dependencies);
    const edges = createBridgeEdges(dependencies);

    const bridgeData: BridgeData = {
      sourceFile,
      dependencies,
      nodes,
      edges,
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalDependencies: dependencies.length,
        criticalCount: dependencies.filter(d => d.importance === "critical").length,
        highCount: dependencies.filter(d => d.importance === "high").length,
        mediumCount: dependencies.filter(d => d.importance === "medium").length,
        lowCount: dependencies.filter(d => d.importance === "low").length,
      },
    };

    return NextResponse.json({ success: true, data: bridgeData });
  } catch (error) {
    console.error("Error analyzing bridge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze file dependencies" },
      { status: 500 }
    );
  }
}
