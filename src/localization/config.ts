export const supportedLocales = ["sq", "de", "en"] as const;
export type SupportedLocale = typeof supportedLocales[number];
export const defaultLocale: SupportedLocale = "sq";
export const fallbackLocale: SupportedLocale = "en";
