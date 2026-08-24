const BASE_FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:disabled:bg-slate-800/50";

const SELECT_FIELD =
  "appearance-none pr-9 cursor-pointer";

export default function Field({
  label,
  required,
  hint,
  error,
  className = "",
  children,
  htmlFor,
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && (
        <p className="field-error mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`${BASE_FIELD} ${props.className || ""}`} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`${BASE_FIELD} ${SELECT_FIELD} ${props.className || ""}`}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
      </svg>
    </div>
  );
}

export function TextArea(props) {
  return <textarea {...props} className={`${BASE_FIELD} resize-none ${props.className || ""}`} />;
}