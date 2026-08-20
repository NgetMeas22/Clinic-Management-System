export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <div className="rounded-full bg-slate-100 p-3 text-slate-400 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}