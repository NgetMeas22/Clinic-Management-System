import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:-translate-y-px hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 active:translate-y-0 active:scale-[0.98] focus-visible:ring-blue-500/30",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:-translate-y-px hover:bg-red-700 hover:shadow-md hover:shadow-red-600/25 active:translate-y-0 active:scale-[0.98] focus-visible:ring-red-500/30",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
};

const SIZES = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
