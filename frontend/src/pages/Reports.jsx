import { useEffect, useState } from "react";
import {
  FileText,
  Stethoscope,
  Users,
  CalendarDays,
  Wallet,
  Package,
  Download,
  Inbox,
} from "lucide-react";
import reportService from "../services/reportService";

export default function Reports() {
  const reportTypes = [
    { id: "doctor", label: "Doctor Report", icon: Stethoscope },
    { id: "patient", label: "Patient Report", icon: Users },
    { id: "appointment", label: "Appointment Report", icon: CalendarDays },
    { id: "revenue", label: "Revenue Report", icon: Wallet },
    { id: "inventory", label: "Inventory Report", icon: Package },
  ];

  const [activeId, setActiveId] = useState("doctor");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRows = async (reportId) => {
    try {
      setLoading(true);
      setError("");
      let res;
      switch (reportId) {
        case "doctor":
          res = await reportService.getDoctors();
          break;
        case "patient":
          res = await reportService.getPatients();
          break;
        case "appointment":
          res = await reportService.getAppointments();
          break;
        case "revenue":
          res = await reportService.getPayments();
          break;
        default:
          res = await reportService.getMedicines();
          break;
      }
      const data = res?.data?.data || res?.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Failed to load ${reportId} report:`, err);
      setError("Couldn't load this report. Try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line -- intentional: fetch rows when the active report changes
    loadRows(activeId);
  }, [activeId]);

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const nameOf = (row, keys) => {
    for (const key of keys) {
      const value = row?.[key];
      if (typeof value === "string" && value.trim()) return value;
    }
    const user = row?.user;
    if (user?.name) return user.name;
    const first = row?.first_name;
    const last = row?.last_name;
    if (first || last) return `${first || ""} ${last || ""}`.trim();
    return "—";
  };

  const buildColumns = () => {
    switch (activeId) {
      case "doctor":
        return {
          headers: ["ID", "Name", "Specialization", "Department", "Phone", "Status"],
          cells: (r) => [
            r.id,
            nameOf(r, []),
            r.specialization || "—",
            r.department?.name || "—",
            r.user?.phone || r.phone || "—",
            r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—",
          ],
        };
      case "patient":
        return {
          headers: ["ID", "Name", "Gender", "Phone", "Status"],
          cells: (r) => [
            r.id,
            nameOf(r, []),
            r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : "—",
            r.phone || "—",
            r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—",
          ],
        };
      case "appointment":
        return {
          headers: ["ID", "Patient", "Doctor", "Date", "Time", "Status"],
          cells: (r) => [
            r.id,
            `${r.patient?.first_name || ""} ${r.patient?.last_name || ""}`.trim() || "—",
            r.doctor?.user?.name || "—",
            formatDate(r.appointment_date),
            r.appointment_time || "—",
            r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—",
          ],
        };
      case "revenue":
        return {
          headers: ["ID", "Patient", "Amount", "Method", "Status", "Date"],
          cells: (r) => [
            r.id,
            `${r.patient?.first_name || ""} ${r.patient?.last_name || ""}`.trim() || "—",
            `$${Number(r.amount || 0).toLocaleString()}`,
            r.payment_method ? r.payment_method.charAt(0).toUpperCase() + r.payment_method.slice(1) : "—",
            r.payment_status ? r.payment_status.charAt(0).toUpperCase() + r.payment_status.slice(1) : "—",
            formatDate(r.payment_date),
          ],
        };
      default:
        return {
          headers: ["ID", "Item", "Category", "Stock", "Price", "Expiry"],
          cells: (r) => [
            r.id,
            r.name || "—",
            r.category || "—",
            r.quantity ?? "—",
            `$${Number(r.price || 0).toLocaleString()}`,
            formatDate(r.expiry_date),
          ],
        };
    }
  };

  const active = reportTypes.find((r) => r.id === activeId);
  const { headers, cells } = buildColumns();

  const exportCsv = () => {
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        cells(r)
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.id}-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    // NOTE: do NOT use "noopener,noreferrer" here — with those features the
    // returned WindowProxy is null and the print dialog never opens.
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      window.alert(
        "Could not open the print window. Please allow pop-ups for this site and try again."
      );
      return;
    }

    const title = `${active.label} - NGM Clinic`;
    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const rowsHtml = rows
      .map(
        (row) => `
          <tr>
            ${cells(row)
              .map((cell) => `<td>${escapeHtml(cell)}</td>`)
              .join("")}
          </tr>`
      )
      .join("");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              background: #fff;
            }
            h1 {
              margin: 0 0 6px;
              font-size: 24px;
            }
            p {
              margin: 0 0 20px;
              color: #475569;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #dbe2ea;
              padding: 10px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #eff6ff;
              color: #1e3a8a;
            }
            tbody tr:nth-child(even) td {
              background: #f8fafc;
            }
            .empty {
              padding: 48px 0;
              text-align: center;
              color: #64748b;
            }
            @media print {
              body { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          ${
            rows.length
              ? `
                <table>
                  <thead>
                    <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
              `
              : `<div class="empty">No data available for this report.</div>`
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

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
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={exportPdf}
            disabled={rows.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
          >
            <FileText size={15} />
            Export PDF
          </button>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40">
                {headers.map((col) => (
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    {headers.map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length > 0 ? (
                rows.map((row, i) => (
                  <tr key={row.id ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    {cells(row).map((cell, j) => (
                      <td key={j} className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Inbox size={22} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">
                          No data for this report
                        </p>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                          Check back once records exist.
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
