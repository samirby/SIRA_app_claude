// Single source of truth for the installed SIRA application build.
// Do not let an old APP_VERSION value in .env override the UI version.
export const APP_VERSION = "0.14.5";
export const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL || "development";
