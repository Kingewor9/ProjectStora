/**
 * Display-only mirror of the backend's credit economics (app/config.py).
 * The backend is always the source of truth for what actually gets
 * credited — these values just keep the UI's displayed numbers in sync
 * without hardcoding them inside individual components.
 */
export const settings = {
    dailyBonus: 5,
    inviteBonus: 15,
    subscribeBonus: 5,
    adWatchReward: 3,
    saveFileCost: 2,
    starsToCreditsRate: 5, // 1 credit = N Telegram Stars
    officialChannelUsername: "Stora_Official",
    adsgramBlockId: import.meta.env.VITE_ADSGRAM_BLOCK_ID ?? "",
};