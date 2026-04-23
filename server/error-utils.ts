import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

function humanizeFieldName(field: string): string {
  if (!field) return "Field";
  const cleaned = field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatZodIssue(issue: any): string {
  const path = (issue.path || []).filter((p: any) => typeof p === "string");
  const field = path.length > 0 ? humanizeFieldName(String(path[path.length - 1])) : "";
  const code = issue.code as string | undefined;

  if (code === "too_small") {
    if (issue.type === "string") {
      return field
        ? `${field} must be at least ${issue.minimum} character${issue.minimum === 1 ? "" : "s"}.`
        : `Value must be at least ${issue.minimum} characters.`;
    }
    if (issue.type === "number") {
      return field ? `${field} must be at least ${issue.minimum}.` : `Value must be at least ${issue.minimum}.`;
    }
    if (issue.type === "array") {
      return field ? `${field} must contain at least ${issue.minimum} item(s).` : `At least ${issue.minimum} item(s) required.`;
    }
  }
  if (code === "too_big") {
    if (issue.type === "string") {
      return field
        ? `${field} must be at most ${issue.maximum} character${issue.maximum === 1 ? "" : "s"}.`
        : `Value must be at most ${issue.maximum} characters.`;
    }
    if (issue.type === "number") {
      return field ? `${field} must be at most ${issue.maximum}.` : `Value must be at most ${issue.maximum}.`;
    }
  }
  if (code === "invalid_string") {
    if (issue.validation === "email") return field ? `${field} must be a valid email.` : "Invalid email address.";
    if (issue.validation === "regex") return field ? `${field} format is invalid.` : "Invalid format.";
    if (issue.validation === "url") return field ? `${field} must be a valid URL.` : "Invalid URL.";
  }
  if (code === "invalid_type") {
    if (issue.received === "undefined") return field ? `${field} is required.` : "Field is required.";
    return field ? `${field} is invalid.` : "Invalid value.";
  }
  if (code === "invalid_enum_value") {
    return field ? `${field} has an invalid value.` : "Invalid value.";
  }

  if (typeof issue.message === "string" && issue.message) {
    if (field) return `${field}: ${issue.message}`;
    return issue.message;
  }

  return "Invalid input.";
}

export function formatErrorMessage(err: unknown, fallback = "An error occurred."): string {
  if (!err) return fallback;

  if (err instanceof ZodError) {
    const first = err.issues?.[0];
    if (first) return formatZodIssue(first);
    try {
      return fromZodError(err).message;
    } catch {
      return fallback;
    }
  }

  if (typeof err === "string") {
    return cleanRawMessage(err) || fallback;
  }

  if (typeof err === "object" && err !== null) {
    const anyErr = err as any;
    if (Array.isArray(anyErr.issues) && anyErr.issues.length > 0) {
      return formatZodIssue(anyErr.issues[0]);
    }
    if (typeof anyErr.message === "string") {
      return cleanRawMessage(anyErr.message) || fallback;
    }
  }

  return fallback;
}

function cleanRawMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return formatZodIssue(parsed[0]);
      }
      if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as any).issues) && (parsed as any).issues.length > 0) {
          return formatZodIssue((parsed as any).issues[0]);
        }
        if (typeof (parsed as any).message === "string") {
          return (parsed as any).message;
        }
      }
    } catch {
      // not JSON, fall through
    }
  }

  return trimmed;
}
