import sq from "./locales/sq/common.json";
import de from "./locales/de/common.json";
import en from "./locales/en/common.json";
import type { SupportedLocale } from "./config";

const dictionaries = { sq, de, en } as const;

export function translate(locale: SupportedLocale, key: string): string {
  const selected = dictionaries[locale] as Record<string, string>;
  const fallback = dictionaries.en as Record<string, string>;
  return selected[key] ?? fallback[key] ?? key;
}
