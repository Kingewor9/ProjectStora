export interface GigaOfferWallRewardData {
  rewardId?: string | number;
  hash?: string;
  amount?: number | string;
  userId?: string | number;
  projectId?: string | number;
}

export interface GigaOfferWallSDK {
  open: () => void;
  close: () => void;
  openOffer: (offerId: string | number) => void;
  confirmReward: (rewardId: string | number, hash: string) => Promise<boolean>;
  pending: () => Promise<unknown>;
  getOffers: () => Promise<unknown>;
  getRewards: () => Promise<unknown>;
  claimReward: (rewardId: string | number) => Promise<unknown>;
  hasOffers: () => boolean;
  destroy: () => void;
  on: (event: "rewardClaim", handler: (data: GigaOfferWallRewardData) => void) => void;
  off: (event: "rewardClaim", handler: (data: GigaOfferWallRewardData) => void) => void;
}

interface WindowWithOfferWall extends Window {
  loadOfferWallSDK?: (config: { projectId: string }) => Promise<GigaOfferWallSDK>;
  loadGigaSDKCallbacks?: Array<() => void>;
  gigaOfferWallSDK?: GigaOfferWallSDK;
}

declare const window: WindowWithOfferWall;

let offerWallInitPromise: Promise<GigaOfferWallSDK> | null = null;

function getProjectId(): string {
  return import.meta.env.VITE_GIGAPUB_SCRIPT_ID ?? "7273";
}

function loadOfferWallScript(projectId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-gigapub-offerwall]");
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load GigaPub offerwall script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://wall.giga.pub/api/v1/loader.js?projectId=${projectId}`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-gigapub-offerwall", "true");
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("Failed to load GigaPub offerwall script.")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

function waitForOfferWallSdk(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tick = () => {
      if (typeof window.loadOfferWallSDK === "function") {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("GigaPub offer wall SDK is not available right now."));
        return;
      }

      window.setTimeout(tick, 200);
    };

    tick();
  });
}

export async function initializeOfferWallSDK(options?: {
  onRewardClaim?: (sdk: GigaOfferWallSDK, data: GigaOfferWallRewardData) => Promise<void> | void;
}): Promise<GigaOfferWallSDK> {
  if (window.gigaOfferWallSDK) {
    return window.gigaOfferWallSDK;
  }

  if (offerWallInitPromise) {
    return offerWallInitPromise;
  }

  offerWallInitPromise = (async () => {
    const projectId = getProjectId();

    await loadOfferWallScript(projectId);
    await waitForOfferWallSdk();

    const sdk = await window.loadOfferWallSDK!({ projectId });
    window.gigaOfferWallSDK = sdk;

    if (options?.onRewardClaim) {
      const handler = (data: GigaOfferWallRewardData) => {
        void options.onRewardClaim?.(sdk, data);
      };
      sdk.on("rewardClaim", handler);
    }

    return sdk;
  })();

  try {
    return await offerWallInitPromise;
  } catch (error) {
    offerWallInitPromise = null;
    throw error;
  }
}

export function openOfferWall(): void {
  if (!window.gigaOfferWallSDK) {
    throw new Error("Offer wall is not ready yet.");
  }

  window.gigaOfferWallSDK.open();
}
