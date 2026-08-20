export default function Card({ children, className = "", padded = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}