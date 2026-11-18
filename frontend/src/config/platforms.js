// Set to true when BlackHatWorld is ready to return to the interface.
export const BHW_ENABLED = false;

// Reddit accounts remain available; only CTR verification is paused.
export const REDDIT_CTR_ENABLED = false;

export const isVisiblePlatform = (platform) =>
  BHW_ENABLED || String(platform || "").trim().toLowerCase() !== "bhw";
