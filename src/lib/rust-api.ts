// Rust Bridge API Client
// This module handles communication with the Rust backend for high-performance file analysis

import type { BridgeData, BridgeAnalysisResponse } from "@/types/bridge";

// Railway.app URL - set this in environment variable for production
const RUST_API_URL = process.env.NEXT_PUBLIC_RUST_API_URL || process.env.RUST_API_URL || "http://localhost:8080";

interface RustBridgeRequest {
  owner: string;
  repo: string;
  filePath: string;
  accessToken: string;
}

/**
 * Analyze file dependencies using the Rust backend API
 * Supports all programming languages with high-performance parsing
 */
export async function analyzeWithRustBackend(
  request: RustBridgeRequest
): Promise<BridgeAnalysisResponse> {
  try {
    const response = await fetch(`${RUST_API_URL}/api/bridge/analyze`, {
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
        error: errorData.error || `Rust API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return data as BridgeAnalysisResponse;
  } catch (error) {
    console.error("Error calling Rust backend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Rust backend",
    };
  }
}

/**
 * Check if the Rust backend is available
 */
export async function checkRustBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RUST_API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get Rust API configuration
 */
export function getRustApiConfig() {
  return {
    url: RUST_API_URL,
    isConfigured: !!process.env.NEXT_PUBLIC_RUST_API_URL || !!process.env.RUST_API_URL,
  };
}
