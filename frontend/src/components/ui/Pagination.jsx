import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "../../context/LocaleContext";

function getPageList(page, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  from,
  to,
  total,
  label = "entries",
}) {
  const { t } = useLocale();
  const btnBase =
    "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
  const numberBase =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors";
  const safeTotalPages = Math.max(1, totalPages || 1);
  const pages = getPageList(page, safeTotalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("pagination.showing", {
          from,
          to,
          total,
          label,
        })}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className={btnBase}
        >
          <ChevronLeft size={14} />
          {t("pagination.previous")}
        </button>
        {pages.map((p, index) =>
          p === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-slate-400 dark:text-slate-500"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`${numberBase} ${
                p === page
                  ? "bg-teal-600 text-white dark:bg-teal-500"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange?.(page + 1)}
          className={btnBase}
        >
          {t("pagination.next")}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
