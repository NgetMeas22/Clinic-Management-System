export default function Table({
  columns = [],
  loading = false,
  rows = [],
  renderRow,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey = "id",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              {columns.map((col, i) => (
                <th
                  key={col.key || i}
                  className={`px-3 py-3.5 sm:px-5 ${col.align === "right" ? "text-right" : "text-left"} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-3 py-4 sm:px-5">
                      <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-4">
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                    {emptyIcon}
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{emptyTitle}</p>
                      {emptyDescription && (
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                          {emptyDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key =
                  typeof rowKey === "function"
                    ? rowKey(row)
                    : row?.[rowKey] ?? row?.id;
                return (
                  <tr
                    key={key}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    {renderRow(row)}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}