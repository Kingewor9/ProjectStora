import { useEffect } from "react";
import { startSession } from "@/api/auth.api";
import { useUserStore } from "@/store/userStore";

/**
 * Calls /api/auth/session once on mount (creates the user if new) and
 * hydrates userStore. App.tsx uses `user.is_onboarded` from the store
 * to decide whether to gate the app behind OnboardingPage.
 */
export function useOnboardingCheck() {
  const { user, isLoading, setUser, setLoading } = useUserStore();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const sessionUser = await startSession();
        if (!cancelled) setUser(sessionUser);
      } catch (err) {
        console.error("Failed to start session:", err);
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading };
}
