// Adsgram rewarded-ad SDK — global type definitions
// The SDK is loaded via a <script> tag in index.html and attaches to window.Adsgram

interface AdsgramController {
  /** Opens the rewarded-ad player. Resolves { done: true } when the full ad is watched. */
  show(): Promise<{ done: boolean }>;
  /** Cleanup — call if you need to abort before show() resolves. */
  destroy(): void;
}

interface AdsgramStatic {
  init(config: { blockId: string; debug?: boolean }): AdsgramController;
}

interface Window {
  Adsgram?: AdsgramStatic;
}
