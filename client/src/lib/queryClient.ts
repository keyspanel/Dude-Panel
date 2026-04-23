import { QueryClient, QueryFunction } from "@tanstack/react-query";

function statusFallbackMessage(status: number): string {
  if (status === 400) return "Invalid request.";
  if (status === 401) return "You need to sign in to continue.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Resource not found.";
  if (status === 409) return "Conflict with the current state.";
  if (status === 423) return "Temporarily locked. Please try again later.";
  if (status === 429) return "Too many requests. Please slow down.";
  if (status >= 500) return "Something went wrong on our end. Please try again.";
  return "Request failed.";
}

function extractCleanMessage(raw: string, status: number): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return statusFallbackMessage(status);

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const obj: any = parsed;
        if (typeof obj.message === "string" && obj.message.trim()) {
          return extractCleanMessage(obj.message, status);
        }
        if (typeof obj.error === "string" && obj.error.trim()) {
          return extractCleanMessage(obj.error, status);
        }
        if (Array.isArray(obj) && obj.length > 0 && typeof obj[0]?.message === "string") {
          return obj[0].message;
        }
        if (Array.isArray(obj.issues) && obj.issues[0]?.message) {
          return obj.issues[0].message;
        }
      }
    } catch {
      // not JSON
    }
  }

  return trimmed;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let raw = "";
    try {
      raw = await res.text();
    } catch {
      raw = "";
    }
    const message = extractCleanMessage(raw, res.status) || statusFallbackMessage(res.status);
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
