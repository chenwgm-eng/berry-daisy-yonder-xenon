import { setLocale, useLocale } from "@/lib/i18n";

export function LocaleToggle() {
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}
      className="inline-flex h-11 items-center justify-center px-2 font-mono text-[12px] text-fg-muted transition-colors hover:text-fg"
      aria-label={locale === "en" ? "切换到中文" : "Switch to English"}
      title={locale === "en" ? "切换到中文" : "Switch to English"}
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
