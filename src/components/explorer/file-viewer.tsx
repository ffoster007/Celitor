"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type TokenType =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "literal";

type Token = {
  text: string;
  type: TokenType;
};

type Language =
  | "ts"
  | "tsx"
  | "js"
  | "jsx"
  | "json"
  | "css"
  | "md"
  | "txt";

const JS_TS_KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "switch",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
]);

const JSON_LITERALS = new Set(["true", "false", "null"]);

const getLanguageFromPath = (path: string): Language => {
  const lower = path.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  if (ext === "ts") return "ts";
  if (ext === "tsx") return "tsx";
  if (ext === "js") return "js";
  if (ext === "jsx") return "jsx";
  if (ext === "json") return "json";
  if (ext === "css") return "css";
  if (ext === "md" || ext === "markdown") return "md";
  return "txt";
};

const isIdentStart = (ch: string) => /[A-Za-z_$]/.test(ch);
const isIdentChar = (ch: string) => /[A-Za-z0-9_$]/.test(ch);
const isDigit = (ch: string) => /[0-9]/.test(ch);

const tokenize = (content: string, language: Language): Token[] => {
  const tokens: Token[] = [];
  const lines = content.split("\n");
  let inBlockComment = false;

  const supportsLineComment = language !== "txt" && language !== "md";
  const supportsBlockComment =
    language === "ts" ||
    language === "tsx" ||
    language === "js" ||
    language === "jsx" ||
    language === "css";

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let i = 0;

    while (i < line.length) {
      const ch = line[i] ?? "";

      if (inBlockComment) {
        const end = line.indexOf("*/", i);
        if (end === -1) {
          tokens.push({ text: line.slice(i), type: "comment" });
          i = line.length;
          continue;
        }

        tokens.push({ text: line.slice(i, end + 2), type: "comment" });
        i = end + 2;
        inBlockComment = false;
        continue;
      }

      if (supportsBlockComment && line.startsWith("/*", i)) {
        const end = line.indexOf("*/", i + 2);
        if (end === -1) {
          tokens.push({ text: line.slice(i), type: "comment" });
          i = line.length;
          inBlockComment = true;
          continue;
        }
        tokens.push({ text: line.slice(i, end + 2), type: "comment" });
        i = end + 2;
        continue;
      }

      if (supportsLineComment && line.startsWith("//", i)) {
        tokens.push({ text: line.slice(i), type: "comment" });
        i = line.length;
        continue;
      }

      if (supportsLineComment && ch === "#") {
        tokens.push({ text: line.slice(i), type: "comment" });
        i = line.length;
        continue;
      }

      if (ch === '"' || ch === "'" || ch === "`") {
        const quote = ch;
        let j = i + 1;
        while (j < line.length) {
          const c = line[j] ?? "";
          if (c === "\\") {
            j += 2;
            continue;
          }
          if (c === quote) {
            j += 1;
            break;
          }
          j += 1;
        }
        tokens.push({ text: line.slice(i, j), type: "string" });
        i = j;
        continue;
      }

      if (isDigit(ch)) {
        let j = i + 1;
        while (j < line.length) {
          const c = line[j] ?? "";
          if (isDigit(c) || c === "." || c === "x" || c === "X" || /[a-fA-F]/.test(c)) {
            j += 1;
            continue;
          }
          break;
        }
        tokens.push({ text: line.slice(i, j), type: "number" });
        i = j;
        continue;
      }

      if (isIdentStart(ch)) {
        let j = i + 1;
        while (j < line.length && isIdentChar(line[j] ?? "")) j += 1;
        const word = line.slice(i, j);

        if (language === "json") {
          tokens.push({
            text: word,
            type: JSON_LITERALS.has(word) ? "literal" : "plain",
          });
        } else {
          tokens.push({
            text: word,
            type: JS_TS_KEYWORDS.has(word) ? "keyword" : "plain",
          });
        }

        i = j;
        continue;
      }

      tokens.push({ text: ch, type: "plain" });
      i += 1;
    }

    if (lineIndex < lines.length - 1) {
      tokens.push({ text: "\n", type: "plain" });
    }
  }

  return tokens;
};

const tokenClassName = (type: TokenType) => {
  switch (type) {
    case "comment":
      return "text-slate-500";
    case "string":
      return "text-emerald-400";
    case "number":
      return "text-amber-400";
    case "keyword":
      return "text-sky-400";
    case "literal":
      return "text-violet-400";
    default:
      return "";
  }
};

const renderHighlighted = (content: string, path: string): ReactNode => {
  // Guardrails: very large files can be slow to token-render.
  if (content.length > 200_000) return content;

  const language = getLanguageFromPath(path);
  if (language === "txt") return content;

  const tokens = tokenize(content, language);
  return tokens.map((t, idx) => {
    const cls = tokenClassName(t.type);
    if (!cls) return <span key={idx}>{t.text}</span>;
    return (
      <span key={idx} className={cls}>
        {t.text}
      </span>
    );
  });
};

interface FileViewerProps {
  owner: string;
  repo: string;
  path: string;
  onBack: () => void;
}

const FileViewer = ({
  owner,
  repo,
  path,
  onBack,
}: FileViewerProps) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const filename = useMemo(() => {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
  }, [path]);

  const highlighted = useMemo(() => {
    if (!content) return "";
    return renderHighlighted(content, path);
  }, [content, path]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        setContent("");

        const response = await fetch(
          `/api/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load file content");
        }

        const data: unknown = await response.json();
        const record = data as { content?: unknown };
        setContent(typeof record.content === "string" ? record.content : "");
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [owner, repo, path]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScrollTop = scrollHeight - clientHeight;
      const overflow = maxScrollTop > 1;
      setCanScrollUp(overflow && scrollTop > 1);
      setCanScrollDown(overflow && scrollTop < maxScrollTop - 1);
    };

    update();

    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [content, loading, error]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-700 px-3 py-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-800/50"
          aria-label="Back to explorer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-slate-200">
            {filename}
          </div>
          <div className="truncate text-[11px] text-slate-400">{path}</div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-red-400">{error}</div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3"
            >
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-100 rounded-md border border-slate-800 bg-slate-950 p-3">
                {highlighted}
              </pre>
            </div>

            {/* Scroll indicators */}
            {canScrollUp && (
              <div className="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-center bg-gradient-to-b from-slate-900 to-transparent pt-2">
                <ChevronUp className="h-4 w-4 text-slate-400" />
              </div>
            )}
            {canScrollDown && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center bg-gradient-to-t from-slate-900 to-transparent pb-2">
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
