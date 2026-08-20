import { useEffect } from "react";
import { Languages } from "lucide-react";
import { useLocale } from "../context/LocaleContext";

export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale } = useLocale();

  // Syncs <html lang="..."> attribute with the selected locale
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const btnClass = (active) =>
    `rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/50 px-1.5 py-1.5 dark:border-slate-700/80 dark:bg-slate-800/50"
      title={locale === "en" ? "ភាសា" : "Language"}
    >
      {!compact && (
        <Languages
          size={15}
          className="ml-1 hidden text-slate-400 sm:block"
        />
      )}
      <button onClick={() => setLocale("en")} className={btnClass(locale === "en")}>
        English
      </button>
      <button onClick={() => setLocale("km")} className={btnClass(locale === "km")}>
        Khmer
      </button>
    </div>
  );
}