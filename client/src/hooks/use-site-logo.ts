import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useSiteLogo() {
  const { data, isLoading } = useQuery<{ siteLogo: string }>({
    queryKey: ["/api/settings/site-logo"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const siteLogo = data?.siteLogo || "";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;
    const existing = head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
    existing.forEach((el) => el.parentNode?.removeChild(el));
    if (siteLogo) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = siteLogo;
      head.appendChild(link);
    }
  }, [siteLogo]);

  return { siteLogo, isLoading };
}
