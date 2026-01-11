package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
)

// DependencyNode represents a file and its dependencies
type DependencyNode struct {
	Path         string           `json:"path"`
	Name         string           `json:"name"`
	Type         string           `json:"type"`
	Importance   int              `json:"importance"`
	Dependencies []DependencyLink `json:"dependencies"`
	Exports      []string         `json:"exports"`
	Language     string           `json:"language"`
}

// DependencyLink represents a connection between files
type DependencyLink struct {
	TargetPath  string   `json:"targetPath"`
	ImportType  string   `json:"importType"` // "default", "named", "namespace", "sideEffect"
	ImportNames []string `json:"importNames"`
	LineNumber  int      `json:"lineNumber"`
	IsExternal  bool     `json:"isExternal"`
}

// BridgeRequest represents the analysis request
type BridgeRequest struct {
	FilePath    string            `json:"filePath"`
	FileContent string            `json:"fileContent"`
	RepoFiles   map[string]string `json:"repoFiles"` // path -> content
	Owner       string            `json:"owner"`
	Repo        string            `json:"repo"`
}

// BridgeResponse represents the analysis result
type BridgeResponse struct {
	SourceFile   DependencyNode   `json:"sourceFile"`
	Dependencies []DependencyNode `json:"dependencies"`
	Dependents   []DependencyNode `json:"dependents"` // Files that import the source
	TotalNodes   int              `json:"totalNodes"`
	TotalEdges   int              `json:"totalEdges"`
}

// LanguagePatterns holds regex patterns for different languages
type LanguagePatterns struct {
	Imports []*regexp.Regexp
	Exports []*regexp.Regexp
}

var languagePatterns = map[string]LanguagePatterns{
	"typescript": {
		Imports: []*regexp.Regexp{
			// ES6 imports
			regexp.MustCompile(`(?m)^import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*from\s*['"]([^'"]+)['"]`),
			regexp.MustCompile(`(?m)^import\s+\*\s+as\s+(\w+)\s+from\s*['"]([^'"]+)['"]`),
			regexp.MustCompile(`(?m)^import\s+['"]([^'"]+)['"]`),
			// Dynamic imports
			regexp.MustCompile(`import\(['"]([^'"]+)['"]\)`),
			// Require
			regexp.MustCompile(`require\(['"]([^'"]+)['"]\)`),
		},
		Exports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)`),
			regexp.MustCompile(`(?m)^export\s+\{([^}]+)\}`),
			regexp.MustCompile(`(?m)^export\s+default`),
		},
	},
	"javascript": {
		Imports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*from\s*['"]([^'"]+)['"]`),
			regexp.MustCompile(`(?m)^import\s+\*\s+as\s+(\w+)\s+from\s*['"]([^'"]+)['"]`),
			regexp.MustCompile(`(?m)^import\s+['"]([^'"]+)['"]`),
			regexp.MustCompile(`import\(['"]([^'"]+)['"]\)`),
			regexp.MustCompile(`require\(['"]([^'"]+)['"]\)`),
		},
		Exports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)`),
			regexp.MustCompile(`(?m)^export\s+\{([^}]+)\}`),
			regexp.MustCompile(`(?m)^export\s+default`),
			regexp.MustCompile(`module\.exports\s*=`),
		},
	},
	"python": {
		Imports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^from\s+([.\w]+)\s+import\s+(.+)`),
			regexp.MustCompile(`(?m)^import\s+([.\w]+)(?:\s+as\s+\w+)?`),
		},
		Exports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^def\s+(\w+)\s*\(`),
			regexp.MustCompile(`(?m)^class\s+(\w+)`),
			regexp.MustCompile(`(?m)^(\w+)\s*=`),
		},
	},
	"go": {
		Imports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)import\s+\(\s*([^)]+)\s*\)`),
			regexp.MustCompile(`(?m)import\s+"([^"]+)"`),
		},
		Exports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^func\s+([A-Z]\w*)`),
			regexp.MustCompile(`(?m)^type\s+([A-Z]\w*)`),
			regexp.MustCompile(`(?m)^var\s+([A-Z]\w*)`),
			regexp.MustCompile(`(?m)^const\s+([A-Z]\w*)`),
		},
	},
	"rust": {
		Imports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^use\s+([^;]+);`),
			regexp.MustCompile(`(?m)^mod\s+(\w+);`),
		},
		Exports: []*regexp.Regexp{
			regexp.MustCompile(`(?m)^pub\s+fn\s+(\w+)`),
			regexp.MustCompile(`(?m)^pub\s+struct\s+(\w+)`),
			regexp.MustCompile(`(?m)^pub\s+enum\s+(\w+)`),
			regexp.MustCompile(`(?m)^pub\s+trait\s+(\w+)`),
		},
	},
}

func getLanguage(filePath string) string {
	ext := strings.ToLower(filePath)
	switch {
	case strings.HasSuffix(ext, ".ts"), strings.HasSuffix(ext, ".tsx"):
		return "typescript"
	case strings.HasSuffix(ext, ".js"), strings.HasSuffix(ext, ".jsx"), strings.HasSuffix(ext, ".mjs"):
		return "javascript"
	case strings.HasSuffix(ext, ".py"):
		return "python"
	case strings.HasSuffix(ext, ".go"):
		return "go"
	case strings.HasSuffix(ext, ".rs"):
		return "rust"
	case strings.HasSuffix(ext, ".css"), strings.HasSuffix(ext, ".scss"), strings.HasSuffix(ext, ".sass"):
		return "css"
	case strings.HasSuffix(ext, ".json"):
		return "json"
	default:
		return "unknown"
	}
}

func extractImports(content, language string) []DependencyLink {
	patterns, ok := languagePatterns[language]
	if !ok {
		return nil
	}

	var links []DependencyLink
	lines := strings.Split(content, "\n")

	for lineNum, line := range lines {
		for _, pattern := range patterns.Imports {
			matches := pattern.FindAllStringSubmatch(line, -1)
			for _, match := range matches {
				link := parseDependencyMatch(match, language, lineNum+1)
				if link.TargetPath != "" {
					links = append(links, link)
				}
			}
		}
	}

	return links
}

func parseDependencyMatch(match []string, language string, lineNum int) DependencyLink {
	link := DependencyLink{
		LineNumber: lineNum,
	}

	switch language {
	case "typescript", "javascript":
		if len(match) >= 4 {
			// Standard import: import X, { Y } from 'path'
			link.TargetPath = match[3]
			if match[1] != "" {
				link.ImportType = "default"
				link.ImportNames = append(link.ImportNames, match[1])
			}
			if match[2] != "" {
				link.ImportType = "named"
				names := strings.Split(match[2], ",")
				for _, name := range names {
					name = strings.TrimSpace(name)
					if name != "" {
						link.ImportNames = append(link.ImportNames, name)
					}
				}
			}
		} else if len(match) >= 3 {
			// Namespace import: import * as X from 'path'
			link.TargetPath = match[2]
			link.ImportType = "namespace"
			link.ImportNames = append(link.ImportNames, match[1])
		} else if len(match) >= 2 {
			// Side-effect import or dynamic import
			link.TargetPath = match[1]
			link.ImportType = "sideEffect"
		}
	case "python":
		if len(match) >= 3 {
			link.TargetPath = match[1]
			link.ImportType = "named"
			names := strings.Split(match[2], ",")
			for _, name := range names {
				name = strings.TrimSpace(name)
				if name != "" {
					link.ImportNames = append(link.ImportNames, name)
				}
			}
		} else if len(match) >= 2 {
			link.TargetPath = match[1]
			link.ImportType = "default"
		}
	case "go":
		if len(match) >= 2 {
			importStr := match[1]
			// Handle multi-line imports
			imports := strings.Split(importStr, "\n")
			for _, imp := range imports {
				imp = strings.TrimSpace(imp)
				imp = strings.Trim(imp, `"`)
				if imp != "" && !strings.HasPrefix(imp, "//") {
					link.TargetPath = imp
					link.ImportType = "default"
				}
			}
		}
	case "rust":
		if len(match) >= 2 {
			link.TargetPath = match[1]
			link.ImportType = "default"
		}
	}

	// Determine if external
	link.IsExternal = isExternalDependency(link.TargetPath, language)

	return link
}

func isExternalDependency(path, language string) bool {
	switch language {
	case "typescript", "javascript":
		// External if doesn't start with . or @/ or ~/
		return !strings.HasPrefix(path, ".") &&
			!strings.HasPrefix(path, "@/") &&
			!strings.HasPrefix(path, "~/")
	case "python":
		// External if first part is not a relative import
		return !strings.HasPrefix(path, ".")
	case "go":
		// External if not local package
		return strings.Contains(path, "/")
	case "rust":
		// External if from crates
		return !strings.HasPrefix(path, "crate::") && !strings.HasPrefix(path, "self::") && !strings.HasPrefix(path, "super::")
	default:
		return true
	}
}

func extractExports(content, language string) []string {
	patterns, ok := languagePatterns[language]
	if !ok {
		return nil
	}

	var exports []string
	seen := make(map[string]bool)

	for _, pattern := range patterns.Exports {
		matches := pattern.FindAllStringSubmatch(content, -1)
		for _, match := range matches {
			if len(match) >= 2 {
				names := strings.Split(match[1], ",")
				for _, name := range names {
					name = strings.TrimSpace(name)
					if name != "" && !seen[name] {
						exports = append(exports, name)
						seen[name] = true
					}
				}
			}
		}
	}

	return exports
}

func resolveImportPath(sourcePath, importPath string, repoFiles map[string]string) string {
	if isExternalDependency(importPath, "typescript") {
		return importPath
	}

	// Handle alias imports (@/, ~/)
	if strings.HasPrefix(importPath, "@/") {
		importPath = "src/" + strings.TrimPrefix(importPath, "@/")
	}

	// Get directory of source file
	sourceDir := ""
	if idx := strings.LastIndex(sourcePath, "/"); idx >= 0 {
		sourceDir = sourcePath[:idx]
	}

	// Resolve relative path
	var resolved string
	if strings.HasPrefix(importPath, "./") {
		resolved = sourceDir + "/" + strings.TrimPrefix(importPath, "./")
	} else if strings.HasPrefix(importPath, "../") {
		parts := strings.Split(sourceDir, "/")
		importParts := strings.Split(importPath, "/")

		upCount := 0
		for _, p := range importParts {
			if p == ".." {
				upCount++
			} else {
				break
			}
		}

		if upCount <= len(parts) {
			remaining := parts[:len(parts)-upCount]
			resolved = strings.Join(remaining, "/") + "/" + strings.Join(importParts[upCount:], "/")
		}
	} else {
		resolved = importPath
	}

	// Clean up path
	resolved = strings.ReplaceAll(resolved, "//", "/")
	resolved = strings.TrimPrefix(resolved, "/")

	// Try to find the actual file
	extensions := []string{"", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"}
	for _, ext := range extensions {
		testPath := resolved + ext
		if _, exists := repoFiles[testPath]; exists {
			return testPath
		}
	}

	return resolved
}

func calculateImportance(node *DependencyNode, allDeps map[string][]string) int {
	// Importance is based on:
	// 1. Number of times this file is imported by others (higher = more important)
	// 2. Number of exports (more exports = potentially more important)
	// 3. File type priority

	importance := 0

	// Count how many files import this one
	for _, deps := range allDeps {
		for _, dep := range deps {
			if dep == node.Path {
				importance += 10
			}
		}
	}

	// Add importance based on exports
	importance += len(node.Exports) * 2

	// Add importance based on file type
	switch {
	case strings.Contains(node.Path, "/lib/") || strings.Contains(node.Path, "/utils/"):
		importance += 5
	case strings.Contains(node.Path, "/components/"):
		importance += 3
	case strings.Contains(node.Path, "/types/"):
		importance += 4
	}

	return importance
}

func analyzeBridge(req BridgeRequest) BridgeResponse {
	language := getLanguage(req.FilePath)

	// Analyze source file
	sourceImports := extractImports(req.FileContent, language)
	sourceExports := extractExports(req.FileContent, language)

	// Build dependency map for all files
	allDeps := make(map[string][]string)
	allNodes := make(map[string]*DependencyNode)

	// Analyze all repo files
	for path, content := range req.RepoFiles {
		fileLang := getLanguage(path)
		imports := extractImports(content, fileLang)
		exports := extractExports(content, fileLang)

		node := &DependencyNode{
			Path:     path,
			Name:     getFileName(path),
			Type:     getFileType(path),
			Language: fileLang,
			Exports:  exports,
		}

		var depPaths []string
		for _, imp := range imports {
			resolvedPath := resolveImportPath(path, imp.TargetPath, req.RepoFiles)
			depPaths = append(depPaths, resolvedPath)
			node.Dependencies = append(node.Dependencies, DependencyLink{
				TargetPath:  resolvedPath,
				ImportType:  imp.ImportType,
				ImportNames: imp.ImportNames,
				LineNumber:  imp.LineNumber,
				IsExternal:  imp.IsExternal,
			})
		}

		allDeps[path] = depPaths
		allNodes[path] = node
	}

	// Calculate importance for all nodes
	for _, node := range allNodes {
		node.Importance = calculateImportance(node, allDeps)
	}

	// Build source node
	sourceNode := DependencyNode{
		Path:     req.FilePath,
		Name:     getFileName(req.FilePath),
		Type:     getFileType(req.FilePath),
		Language: language,
		Exports:  sourceExports,
	}

	// Resolve dependencies for source file
	var dependencies []DependencyNode
	seenDeps := make(map[string]bool)

	for _, imp := range sourceImports {
		resolvedPath := resolveImportPath(req.FilePath, imp.TargetPath, req.RepoFiles)

		if seenDeps[resolvedPath] {
			continue
		}
		seenDeps[resolvedPath] = true

		sourceNode.Dependencies = append(sourceNode.Dependencies, DependencyLink{
			TargetPath:  resolvedPath,
			ImportType:  imp.ImportType,
			ImportNames: imp.ImportNames,
			LineNumber:  imp.LineNumber,
			IsExternal:  imp.IsExternal,
		})

		if node, exists := allNodes[resolvedPath]; exists {
			dependencies = append(dependencies, *node)
		} else {
			// External or unresolved dependency
			dependencies = append(dependencies, DependencyNode{
				Path:       resolvedPath,
				Name:       getFileName(resolvedPath),
				Type:       "external",
				Importance: 0,
				Language:   language,
			})
		}
	}

	// Find files that depend on the source file (dependents)
	var dependents []DependencyNode
	seenDependents := make(map[string]bool)

	for path, deps := range allDeps {
		if path == req.FilePath {
			continue
		}
		for _, dep := range deps {
			if dep == req.FilePath && !seenDependents[path] {
				seenDependents[path] = true
				if node, exists := allNodes[path]; exists {
					dependents = append(dependents, *node)
				}
				break
			}
		}
	}

	// Sort by importance
	sort.Slice(dependencies, func(i, j int) bool {
		return dependencies[i].Importance > dependencies[j].Importance
	})
	sort.Slice(dependents, func(i, j int) bool {
		return dependents[i].Importance > dependents[j].Importance
	})

	// Calculate source importance
	sourceNode.Importance = calculateImportance(&sourceNode, allDeps)

	totalEdges := len(dependencies) + len(dependents)

	return BridgeResponse{
		SourceFile:   sourceNode,
		Dependencies: dependencies,
		Dependents:   dependents,
		TotalNodes:   len(dependencies) + len(dependents) + 1,
		TotalEdges:   totalEdges,
	}
}

func getFileName(path string) string {
	if idx := strings.LastIndex(path, "/"); idx >= 0 {
		return path[idx+1:]
	}
	return path
}

func getFileType(path string) string {
	name := getFileName(path)

	switch {
	case strings.Contains(path, "/components/"):
		return "component"
	case strings.Contains(path, "/lib/") || strings.Contains(path, "/utils/"):
		return "utility"
	case strings.Contains(path, "/types/"):
		return "type"
	case strings.Contains(path, "/api/"):
		return "api"
	case strings.Contains(path, "/app/") && (strings.HasSuffix(name, "page.tsx") || strings.HasSuffix(name, "page.ts")):
		return "page"
	case strings.HasSuffix(name, ".config.ts") || strings.HasSuffix(name, ".config.js") || strings.HasSuffix(name, ".json"):
		return "config"
	case strings.HasSuffix(name, ".css") || strings.HasSuffix(name, ".scss"):
		return "style"
	default:
		return "file"
	}
}

func handleBridge(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BridgeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	response := analyzeBridge(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/api/bridge/analyze", handleBridge)
	http.HandleFunc("/api/health", handleHealth)

	log.Printf("Bridge analyzer server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
