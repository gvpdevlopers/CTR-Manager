// Set to true when BlackHatWorld is ready to return to the interface.
export const BHW_ENABLED = false;

// Reddit CTR monitoring is available again.
export const REDDIT_CTR_ENABLED = true;

export const isVisiblePlatform = (platform) =>
  BHW_ENABLED || String(platform || "").trim().toLowerCase() !== "bhw";
