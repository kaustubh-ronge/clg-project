"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function FetchInterceptor() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Clone response to read JSON without consuming the original stream
      // We only care about 403 Forbidden responses
      if (response.status === 403) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();

          if (data?.error === "ACCOUNT_REVOKED") {
            alert("Your account access has changed. An administrator has revoked your approval. Please sign in again to continue.");
            router.push("/onboarding");
          } else if (data?.error === "FORBIDDEN") {
            alert("You do not have permission to perform this action.");
          }
        } catch (e) {
          // Response wasn't JSON, ignore
        }
      }

      return response;
    };

    // Cleanup isn't strictly necessary for a global root interceptor, 
    // but good practice to restore original fetch if component unmounts.
    return () => {
      window.fetch = originalFetch;
      initialized.current = false;
    };
  }, [router]);

  return null;
}
