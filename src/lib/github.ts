// GitHub API utility functions

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  default_branch: string;
  updated_at: string;
  language: string | null;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeItem[];
}

const GITHUB_API_BASE = "https://api.github.com";

export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchRepoContents(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<GitHubContent[]> {
  const url = path
    ? `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`
    : `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contents: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Ensure we always return an array
  return Array.isArray(data) ? data : [data];
}

export async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const data = await response.json();
  
  // GitHub returns file content in base64
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  throw new Error("Unable to decode file content");
}

// Sort contents: folders first, then files, alphabetically
export function sortContents(contents: GitHubContent[]): GitHubContent[] {
  return [...contents].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "dir" ? -1 : 1;
  });
}
