/**
 * Input validation utilities for API routes
 * Best Practice: Centralized validation for consistent security
 */

// String validation with max length
export function validateString(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): string | null {
  const { minLength = 0, maxLength = 255, required = true } = options;

  if (value === undefined || value === null || value === "") {
    return required ? `${fieldName} is required` : null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }

  if (trimmed.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} characters`;
  }

  return null;
}

// Validate CUID format (Prisma default ID)
const CUID_REGEX = /^c[a-z0-9]{24}$/;
export function validateCuid(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  if (!CUID_REGEX.test(value)) {
    return `${fieldName} must be a valid ID`;
  }

  return null;
}

// Validate repository owner/name (GitHub format)
const REPO_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
export function validateRepoIdentifier(
  value: unknown,
  fieldName: string
): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return `${fieldName} is required`;
  }

  if (trimmed.length > 100) {
    return `${fieldName} is too long`;
  }

  if (!REPO_NAME_REGEX.test(trimmed)) {
    return `${fieldName} contains invalid characters`;
  }

  return null;
}

// Validate file path (prevent path traversal)
export function validateFilePath(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return `${fieldName} is required`;
  }

  if (trimmed.length > 1000) {
    return `${fieldName} is too long`;
  }

  // Prevent path traversal attacks
  if (trimmed.includes("..") || trimmed.startsWith("/") || trimmed.includes("//")) {
    return `${fieldName} contains invalid path characters`;
  }

  return null;
}

// Validate positive integer
export function validatePositiveInt(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; max?: number } = {}
): string | null {
  const { required = false, max = Number.MAX_SAFE_INTEGER } = options;

  if (value === undefined || value === null) {
    return required ? `${fieldName} is required` : null;
  }

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (typeof num !== "number" || Number.isNaN(num)) {
    return `${fieldName} must be a number`;
  }

  if (!Number.isInteger(num) || num < 0) {
    return `${fieldName} must be a positive integer`;
  }

  if (num > max) {
    return `${fieldName} must be at most ${max}`;
  }

  return null;
}

// Sanitize string for safe output
export function sanitizeString(value: string, maxLength = 255): string {
  return value.trim().substring(0, maxLength);
}

// Type enum validation
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  if (!allowedValues.includes(value as T)) {
    return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
  }

  return null;
}

// Album item type
export const ALBUM_ITEM_TYPES = ["file", "dir"] as const;
export type AlbumItemType = (typeof ALBUM_ITEM_TYPES)[number];

// Batch validation helper
export function validateAll(
  validations: Array<() => string | null>
): string[] {
  return validations
    .map((fn) => fn())
    .filter((error): error is string => error !== null);
}

// Create error response helper
export function createValidationError(errors: string[]) {
  return {
    error: "Validation failed",
    details: errors,
  };
}
