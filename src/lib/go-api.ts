// Go Bridge API Client
// This module handles communication with the Go backend for high-performance file analysis

import type { BridgeAnalysisResponse } from "@/types/bridge";

// Railway.app URL - set this in environment variable for production
const GO_API_URL =
  process.env.NEXT_PUBLIC_GO_API_URL ||
  process.env.GO_API_URL ||
  "http://localhost:8080";

interface GoBridgeRequest {
  owner: string;
  repo: string;
  filePath: string;
  accessToken: string;
}

/**
 * Analyze file dependencies using the Go backend API
 * Supports all programming languages with high-performance parsing
 */
export async function analyzeWithGoBackend(
  request: GoBridgeRequest
): Promise<BridgeAnalysisResponse> {
  try {
    const response = await fetch(`${GO_API_URL}/api/bridge/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Go API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return data as BridgeAnalysisResponse;
  } catch (error) {
    console.error("Error calling Go backend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Go backend",
    };
  }
}

/**
 * Check if the Go backend is available
 */
export async function checkGoBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${GO_API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get Go API configuration
 */
export function getGoApiConfig() {
  return {
    url: GO_API_URL,
    isConfigured: !!process.env.NEXT_PUBLIC_GO_API_URL || !!process.env.GO_API_URL,
  };
}
