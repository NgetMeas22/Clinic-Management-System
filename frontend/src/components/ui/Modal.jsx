import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useLocale } from "../../context/LocaleContext";

const EXIT_MS = 160;

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = "md",
}) {
  const { t } = useLocale();
  const titleId = useId();
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setShown(true);
      setClosing(false);
    } else {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (!closing) return undefined;
    const timer = setTimeout(() => {
      setShown(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!shown) return undefined;
    const handleKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [shown, onClose]);

  if (!shown) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-all ${
        closing ? "modal-backdrop-out" : "modal-backdrop"
      }`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl will-change-transform dark:border-slate-800 dark:bg-slate-900 ${
          closing ? "modal-panel-out" : "modal-panel"
        } ${sizes[size]}`}
      >
        <div
          className={`flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/30 ${
            closing ? "" : "modal-header"
          }`}
        >
          <div className="flex items-center gap-3.5">
            {Icon && (
              <div className="modal-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 id={titleId} className="text-base font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-lg p-2 text-slate-400 transition-all duration-150 hover:rotate-90 hover:bg-slate-100 hover:text-slate-600 active:scale-90 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 py-5 ${closing ? "" : "modal-body"}`}>{children}</div>

        {footer && (
          <div
            className={`flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40 ${
              closing ? "" : "modal-footer"
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
