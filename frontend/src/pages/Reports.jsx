import { useState } from "react";
import {
  FileText,
  Stethoscope,
  Users,
  CalendarDays,
  Wallet,
  Package,
  ChevronDown,
  Download,
  Inbox,
} from "lucide-react";

export default function Reports() {
  const reportTypes = [
    { id: "doctor", label: "Doctor Report", icon: Stethoscope, columns: ["ID", "Name", "Specialization", "Phone"] },
    { id: "patient", label: "Patient Report", icon: Users, columns: ["ID", "Name", "Age", "Last Visit"] },
    { id: "appointment", label: "Appointment Report", icon: CalendarDays, columns: ["ID", "Patient", "Doctor", "Date"] },
    { id: "revenue", label: "Revenue Report", icon: Wallet, columns: ["ID", "Invoice", "Amount", "Date"] },
    { id: "inventory", label: "Inventory Report", icon: Package, columns: ["ID", "Item", "Stock", "Reorder Level"] },
  ];

  const [activeId, setActiveId] = useState("doctor");
  const [menuOpen, setMenuOpen] = useState(false);
  const active = reportTypes.find((r) => r.id === activeId);
  const ActiveIcon = active.icon;

  // Replace with real fetched rows per report type.
  const rows = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <FileText size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Generate and review operational reports across the clinic.
          </p>
        </div>
      </div>

      {/* Report type chips */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          const isActive = r.id === activeId;
          return (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={15} strokeWidth={2.25} />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Custom select */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-56 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <ActiveIcon size={15} className="text-blue-600 dark:text-blue-400" />
                {active.label}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute z-10 mt-1.5 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {reportTypes.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveId(r.id);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        r.id === activeId
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon size={15} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>
        </div>

        <button
          disabled={rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40">
                {active.columns.map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    {active.columns.map((col) => (
                      <td key={col} className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={active.columns.length} className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Inbox size={22} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">
                          No data for this report
                        </p>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                          Try a different date range, or check back once records exist.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}