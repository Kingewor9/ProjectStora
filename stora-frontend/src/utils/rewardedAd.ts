type RewardedAdResult = boolean | { done?: boolean; completed?: boolean; success?: boolean; rewarded?: boolean } | null | undefined;

function isAdCompleted(result: RewardedAdResult): boolean {
  if (typeof result === "boolean") return result;

  if (!result || typeof result !== "object") {
    return false;
  }

  const candidate = result as Record<string, unknown>;
  return candidate.done === true || candidate.completed === true || candidate.success === true || candidate.rewarded === true;
}

function waitForGigaPubGlobal(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tick = () => {
      if (typeof window.showGiga === "function" || typeof window.AdGigaFallback === "function") {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("GigaPub ad SDK did not become available in time."));
        return;
      }

      window.setTimeout(tick, 200);
    };

    tick();
  });
}

function loadGigaPubScript(scriptId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-gigapub-loader]");
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load GigaPub script.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://ad.gigapub.tech/script?id=${scriptId}`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-gigapub-loader", "true");
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load GigaPub script.")), { once: true });
    document.head.appendChild(script);
  });
}

export async function showRewardedAd(): Promise<void> {
  const scriptId = import.meta.env.VITE_GIGAPUB_SCRIPT_ID ?? "7273";

  try {
    if (typeof window.showGiga !== "function" && typeof window.AdGigaFallback !== "function") {
      await loadGigaPubScript(scriptId);
      await waitForGigaPubGlobal();
    }
  } catch (error) {
    console.error("GigaPub ad load failed", error);
    throw new Error("GigaPub ad SDK is not available right now. Please refresh and try again.");
  }

  const gigaPubShow = window.showGiga ?? window.AdGigaFallback;

  if (typeof gigaPubShow !== "function") {
    throw new Error("GigaPub ad SDK is not available right now. Please refresh and try again.");
  }

  const result = await gigaPubShow();

  if (!isAdCompleted(result as RewardedAdResult)) {
    throw new Error("Ad was not completed. Watch the full ad to earn credits.");
  }
}
