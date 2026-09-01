import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  Banknote,
  Calendar,
  CalendarX2,
  Check,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Loader2,
  MoreVertical,
  Pill,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import dashboardService from "../services/dashboardService";
import medicineService from "../services/medicineService";
import paymentService from "../services/paymentService";
import { getAppointments } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";
import unwrapPaginator from "../utils/paginate";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RANGES = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const STATUS_STYLES = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
  completed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const STATUS_HEX = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#f43f5e",
  completed: "#94a3b8",
};

const STATUS_FILTERS = ["all", "confirmed", "pending", "cancelled", "completed"];

const PAYMENT_METHOD_META = {
  cash: { label: "Cash", color: "#10b981", tint: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  aba: { label: "ABA", color: "#2563eb", tint: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  card: { label: "Card", color: "#8b5cf6", tint: "bg-violet-50 text-violet-700 ring-violet-600/20" },
};

const PAYMENT_STATUS_STYLES = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const RANGE_LABELS = {
  week: "this week",
  month: "this month",
  year: "this year",
};

const CARD_META = [
  {
    key: "patients",
    label: "Total patients",
    icon: Users,
    valueKey: "total_patients",
    tint: "from-blue-500 to-blue-600 shadow-blue-500/30",
    ring: "group-hover:border-blue-200 group-hover:shadow-blue-500/10",
    dot: "bg-blue-500",
    sparkKey: "patients",
    sparkColor: "#2563eb",
  },
  {
    key: "doctors",
    label: "Total doctors",
    icon: Stethoscope,
    valueKey: "total_doctors",
    tint: "from-violet-500 to-violet-600 shadow-violet-500/30",
    ring: "group-hover:border-violet-200 group-hover:shadow-violet-500/10",
    dot: "bg-violet-500",
    sparkKey: null,
    sparkColor: "#7c3aed",
  },
  {
    key: "appointments",
    label: "Appointments today",
    icon: Calendar,
    valueKey: "appointments_today",
    tint: "from-amber-500 to-orange-500 shadow-amber-500/30",
    ring: "group-hover:border-amber-200 group-hover:shadow-amber-500/10",
    dot: "bg-amber-500",
    sparkKey: "appointments",
    sparkColor: "#d97706",
  },
  {
    key: "revenue",
    label: "Total revenue",
    icon: Banknote,
    valueKey: "total_revenue",
    tint: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
    ring: "group-hover:border-emerald-200 group-hover:shadow-emerald-500/10",
    dot: "bg-emerald-500",
    sparkKey: "revenue",
    sparkColor: "#059669",
  },
];

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

// Deterministic avatar tint so the same name always gets the same color,
// giving the table a bit of visual variety instead of one flat blue.
const AVATAR_TINTS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarTint(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function compactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatUpdatedAt(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

// Client-side CSV export of whatever appointment rows are currently visible —
// keeps this a genuinely usable feature without requiring a new API endpoint.
function downloadCsv(rows) {
  if (!rows.length) return;
  const header = ["Patient", "Doctor", "Time", "Status"];
  const lines = rows.map((appt) => {
    const patientName =
      `${appt.patient?.first_name || ""} ${appt.patient?.last_name || ""}`.trim() || "Unknown";
    const doctorName = appt.doctor?.user?.name || appt.doctor_name || "—";
    const apptTime = appt.appointment_time || appt.time || "—";
    return [patientName, doctorName, apptTime, appt.status || ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function TrendBadge({ value }) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return null;
  const numeric = Number(value);
  const isUp = numeric >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? "+" : ""}
      {numeric}%
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold text-slate-900">
          {entry.value.toLocaleString()}
          <span className="ml-1 text-xs font-normal capitalize text-slate-400">{entry.dataKey}</span>
        </p>
      ))}
    </div>
  );
}

// Tiny inline trend line used inside each stat card — gives the raw number
// some shape without competing with the main charts below.
function Sparkline({ data, dataKey, color }) {
  if (!data?.length) return null;
  return (
    <div className="h-10 w-20 shrink-0 opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${dataKey})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RangeToggle({ value, onChange, disabled, pendingKey }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {RANGES.map((r) => {
        const isActive = value === r.key;
        const isPending = pendingKey === r.key;
        return (
          <button
            key={r.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 disabled:cursor-not-allowed ${
              isActive
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700 disabled:opacity-50"
            }`}
          >
            {isPending && <Loader2 size={12} className="animate-spin" />}
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

// Animated placeholder that echoes the shape of the real area/bar charts
// so switching ranges doesn't cause a jarring blank flash.
function ChartSkeleton({ variant = "area" }) {
  const bars = [38, 58, 44, 72, 52, 84, 60, 46, 66, 50, 40, 30];
  return (
    <div className="flex h-full w-full animate-pulse flex-col justify-end gap-2 px-1 pb-6">
      <div className="flex h-full items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-md ${variant === "area" ? "bg-slate-100" : "bg-slate-150 bg-slate-100"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="h-2 w-full rounded bg-slate-100" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="mt-5 h-7 w-20 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

// Shared empty-state block: an icon, a short message, and optional action —
// used wherever a list can legitimately be empty, so it reads as an
// intentional state rather than a broken one.
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon size={18} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-xs text-xs text-slate-500">{description}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [range, setRange] = useState("week");
  const [rangeCache, setRangeCache] = useState({});
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState("");

  const [apptSearch, setApptSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleRows, setVisibleRows] = useState(5);

  const canViewPayments = can(user, "payments", "create");
  const [payments, setPayments] = useState([]);

  const loadDashboard = useCallback(async ({ silent } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      const requests = [
        dashboardService.getDashboard(),
        dashboardService.getMonthly(),
        dashboardService.getWeekly(),
        medicineService.getAll({ per_page: 200 }),
        getAppointments({ per_page: 50 }),
      ];
      if (canViewPayments) requests.push(paymentService.getAll({ per_page: 50 }));

      const [dashboardRes, yearlyRes, weeklyRes, medicineRes, apptRes, paymentRes] =
        await Promise.all(requests);

      setStats(dashboardRes.data || {});
      setMedicines(unwrapPaginator(medicineRes).items);

      const apptArray = unwrapPaginator(apptRes).items;
      setRecentAppointments(Array.isArray(apptArray) ? apptArray : []);
      const paymentArray = canViewPayments ? unwrapPaginator(paymentRes).items : [];
      setPayments(Array.isArray(paymentArray) ? paymentArray : []);
      setRangeCache((prev) => ({
        ...prev,
        week: weeklyRes.data || {},
        year: yearlyRes.data || {},
      }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
      setError("Dashboard data could not be loaded. Try refreshing the page.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canViewPayments]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadDashboard();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazily fetch week/month breakdowns the first time each tab is selected.
  const loadRange = useCallback(
    async (key) => {
      if (rangeCache[key]) return;

      setRangeLoading(true);
      setRangeError("");
      try {
        // Expects dashboardService.getWeekly() / getDailyThisMonth() to return
        // { patients: [{ period, total }], appointments: [...], revenue: [...] }
        // where `period` is 1-7 (Mon-Sun) for week, or day-of-month for month.
        const res =
          key === "week" ? await dashboardService.getWeekly() : await dashboardService.getDailyThisMonth();
        setRangeCache((prev) => ({ ...prev, [key]: res.data || {} }));
      } catch (err) {
        console.error(`Failed to load ${key} stats`, err);
        setRangeError(
          `Couldn't load the ${key === "week" ? "weekly" : "monthly"} dashboard breakdown.`
        );
      } finally {
        setRangeLoading(false);
      }
    },
    [rangeCache]
  );

  const handleRangeChange = (key) => {
    setRange(key);
    loadRange(key);
  };

  const pendingRangeKey = rangeLoading ? range : null;
  const isChartLoading = rangeLoading && !rangeCache[range];

  const chartData = useMemo(() => {
    const data = rangeCache[range];

    if (range === "year") {
      const byMonth = Object.fromEntries(
        months.map((name, index) => [index + 1, { label: name, patients: 0, appointments: 0, revenue: 0 }])
      );
      data?.patients?.forEach((item) => {
        if (byMonth[item.month]) byMonth[item.month].patients = Number(item.total || 0);
      });
      data?.appointments?.forEach((item) => {
        if (byMonth[item.month]) byMonth[item.month].appointments = Number(item.total || 0);
      });
      data?.revenue?.forEach((item) => {
        if (byMonth[item.month]) byMonth[item.month].revenue = Number(item.total || 0);
      });
      return Object.values(byMonth);
    }

    if (range === "month") {
      const now = new Date();
      const total = daysInMonth(now.getFullYear(), now.getMonth() + 1);
      const byDay = Object.fromEntries(
        Array.from({ length: total }, (_, i) => [
          i + 1,
          { label: String(i + 1), patients: 0, appointments: 0, revenue: 0 },
        ])
      );
      data?.patients?.forEach((item) => {
        if (byDay[item.day]) byDay[item.day].patients = Number(item.total || 0);
      });
      data?.appointments?.forEach((item) => {
        if (byDay[item.day]) byDay[item.day].appointments = Number(item.total || 0);
      });
      data?.revenue?.forEach((item) => {
        if (byDay[item.day]) byDay[item.day].revenue = Number(item.total || 0);
      });
      return Object.values(byDay);
    }

    // range === "week"
    const byDay = Object.fromEntries(
      weekdays.map((name, index) => [index + 1, { label: name, patients: 0, appointments: 0, revenue: 0 }])
    );
    data?.patients?.forEach((item) => {
      if (byDay[item.weekday]) byDay[item.weekday].patients = Number(item.total || 0);
    });
    data?.appointments?.forEach((item) => {
      if (byDay[item.weekday]) byDay[item.weekday].appointments = Number(item.total || 0);
    });
    data?.revenue?.forEach((item) => {
      if (byDay[item.weekday]) byDay[item.weekday].revenue = Number(item.total || 0);
    });
    return Object.values(byDay);
  }, [rangeCache, range]);

  const lowStock = medicines.filter((item) => Number(item.quantity) <= 10).slice(0, 5);
  const criticalStock = lowStock.filter((item) => Number(item.quantity) <= 3).length;

  const pendingCount = recentAppointments.filter((a) => (a.status || "").toLowerCase() === "pending").length;
  const showAttentionBanner = !loading && (lowStock.length > 0 || pendingCount > 0);

  // Status distribution for the donut — computed from whatever appointment
  // data is already on the page, no extra request needed.
  const statusBreakdown = useMemo(() => {
    const counts = {};
    recentAppointments.forEach((a) => {
      const key = (a.status || "unknown").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({ name: key, value }));
  }, [recentAppointments]);

  // Doctors ranked by how many of the loaded appointments belong to them —
  // a lightweight "who's busiest" view without a dedicated endpoint.
  const topDoctors = useMemo(() => {
    const counts = {};
    recentAppointments.forEach((a) => {
      const name = a.doctor?.user?.name || a.doctor_name;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [recentAppointments]);

  const filteredAppointments = useMemo(() => {
    const q = apptSearch.trim().toLowerCase();
    return recentAppointments.filter((appt) => {
      const status = (appt.status || "").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      const patientName = `${appt.patient?.first_name || ""} ${appt.patient?.last_name || ""}`.toLowerCase();
      const doctorName = (appt.doctor?.user?.name || appt.doctor_name || "").toLowerCase();
      return patientName.includes(q) || doctorName.includes(q);
    });
  }, [recentAppointments, apptSearch, statusFilter]);

  // Totals for the currently selected range — used to enrich the stat cards
  // and the revenue summary with "this week/month/year" context.
  const rangeTotals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.patients += Number(item.patients || 0);
        acc.appointments += Number(item.appointments || 0);
        acc.revenue += Number(item.revenue || 0);
        return acc;
      },
      { patients: 0, appointments: 0, revenue: 0 }
    );
  }, [chartData]);

  const bestRevenueDay = useMemo(() => {
    let best = null;
    chartData.forEach((item) => {
      const value = Number(item.revenue || 0);
      if (value > 0 && (!best || value > best.value)) best = { label: item.label, value };
    });
    return best;
  }, [chartData]);

  const revenueAverage = chartData.length ? rangeTotals.revenue / chartData.length : 0;

  // Payment method breakdown + latest payments (Admin / Receptionist only).
  const paymentMethods = useMemo(() => {
    const counts = {};
    let total = 0;
    payments.forEach((p) => {
      const method = (p.payment_method || "cash").toLowerCase();
      counts[method] = (counts[method] || 0) + 1;
      total += 1;
    });
    return {
      total,
      rows: Object.entries(counts)
        .map(([key, count]) => ({
          key,
          count,
          pct: total ? Math.round((count / total) * 100) : 0,
          ...(PAYMENT_METHOD_META[key] || {
            label: key,
            color: "#94a3b8",
            tint: "bg-slate-50 text-slate-600 ring-slate-500/20",
          }),
        }))
        .sort((a, b) => b.count - a.count),
    };
  }, [payments]);

  const recentPayments = payments.slice(0, 5);

  const cards = CARD_META.map((meta) => {
    const trendKey = `${meta.valueKey}_trend`;
    const isCurrency = meta.key === "revenue";
    const value = isCurrency
      ? currency(stats?.[meta.valueKey])
      : (stats?.[meta.valueKey] ?? 0).toLocaleString();
    let footer;
    if (meta.key === "patients") {
      footer = `+${rangeTotals.patients.toLocaleString()} ${RANGE_LABELS[range]}`;
    } else if (meta.key === "doctors") {
      footer = topDoctors[0] ? `Busiest: ${topDoctors[0].name}` : "On active roster";
    } else if (meta.key === "appointments") {
      footer = pendingCount > 0 ? `${pendingCount} awaiting confirmation` : "No pending bookings";
    } else {
      footer = `${currency(rangeTotals.revenue)} this ${RANGE_LABELS[range]}`;
    }
    return { ...meta, value, trend: stats?.[trendKey], footer };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <ChartSkeleton variant="area" />
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <ChartSkeleton variant="bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1 rounded-full bg-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            {user?.role && (
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                {user.role}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatToday()} · Welcome back{user?.name ? `, ${user.name}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            title="Print this dashboard"
          >
            <Printer size={16} />
            <span className="hidden md:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(filteredAppointments)}
            disabled={!filteredAppointments.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Export visible appointments as CSV"
          >
            <Download size={16} />
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title={lastUpdated ? `Last updated ${formatUpdatedAt(lastUpdated)}` : "Refresh"}
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
          {can(user, "appointments", "create") && (
            <Link
              to="/appointments"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
            >
              <Plus size={18} />
              New appointment
            </Link>
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className="-mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={12} />
          Updated {formatUpdatedAt(lastUpdated)}
        </p>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </span>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="shrink-0 font-semibold underline decoration-red-300 underline-offset-2 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Needs attention */}
      {showAttentionBanner && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Needs attention</p>
              <p className="text-xs text-slate-500">
                {lowStock.length > 0 &&
                  `${lowStock.length} medicine${lowStock.length === 1 ? "" : "s"} running low${
                    criticalStock > 0 ? ` (${criticalStock} critical)` : ""
                  }`}
                {lowStock.length > 0 && pendingCount > 0 && " · "}
                {pendingCount > 0 && `${pendingCount} appointment${pendingCount === 1 ? "" : "s"} awaiting confirmation`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lowStock.length > 0 && (
              <Link
                to="/medicines"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-50"
              >
                Review stock
              </Link>
            )}
            {pendingCount > 0 && (
              <Link
                to="/appointments"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-50"
              >
                Review appointments
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.ring}`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${card.tint.split(" ").slice(0, 2).join(" ")}`} />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-110 ${card.tint}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <TrendBadge value={card.trend} />
                  </div>
                </div>
                {card.sparkKey && (
                  <Sparkline data={chartData} dataKey={card.sparkKey} color={card.sparkColor} />
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.dot}`} />
                <span className="truncate">{card.footer}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trends */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Trends</h2>
          <p className="text-xs text-slate-500">Patients, appointments and revenue</p>
        </div>
        <RangeToggle
          value={range}
          onChange={handleRangeChange}
          disabled={rangeLoading}
          pendingKey={pendingRangeKey}
        />
      </div>

      {rangeError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {rangeError}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Patient visits</h2>
              <p className="text-xs text-slate-500">
                Patients and appointments{" "}
                {range === "year" ? "over the year" : range === "month" ? "this month" : "this week"}
              </p>
            </div>
            <div className="flex gap-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Patients
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Appointments
              </span>
            </div>
          </div>
          <div className="mt-4 h-72">
            {isChartLoading ? (
              <ChartSkeleton variant="area" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="patientsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="appointmentsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval={range === "month" ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={compactNumber}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#patientsFill)"
                    activeDot={{ r: 5 }}
                    isAnimationActive
                  />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#appointmentsFill)"
                    activeDot={{ r: 5 }}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue</h2>
              <p className="text-xs text-slate-500">Earnings {RANGE_LABELS[range]}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <TrendingUp size={12} />
              {RANGE_LABELS[range]}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Total {RANGE_LABELS[range]}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {currency(rangeTotals.revenue)}
                </p>
              </div>
              <Link
                to="/billing"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Billing <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 text-xs">
              <div>
                <p className="text-slate-400">Daily average</p>
                <p className="mt-0.5 font-semibold text-slate-700">{currency(revenueAverage)}</p>
              </div>
              <div>
                <p className="text-slate-400">Best day</p>
                <p className="mt-0.5 truncate font-semibold text-emerald-600">
                  {bestRevenueDay ? `${bestRevenueDay.label} · ${currency(bestRevenueDay.value)}` : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 h-52">
            {isChartLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval={range === "year" ? 1 : range === "month" ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) => `$${compactNumber(v)}`}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="revenue" fill="url(#revenueBar)" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Payments (Admin / Receptionist) */}
      {canViewPayments && (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Payment methods</h2>
                <p className="text-xs text-slate-500">{paymentMethods.total} payments collected</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Wallet size={18} />
              </div>
            </div>
            {paymentMethods.rows.length > 0 ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods.rows}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {paymentMethods.rows.map((row) => (
                          <Cell key={row.key} fill={row.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {paymentMethods.rows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {row.count} <span className="font-normal text-slate-400">· {row.pct}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={Wallet}
                  title="No payments yet"
                  description="Collected payments will show up here by method."
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent payments</h2>
              <Link
                to="/payments"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {recentPayments.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4 font-semibold">Patient</th>
                      <th className="pb-3 pr-4 font-semibold">Method</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 pr-4 text-right font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPayments.map((payment) => {
                      const method = PAYMENT_METHOD_META[payment.payment_method] || {
                        label: payment.payment_method,
                        tint: "bg-slate-50 text-slate-600 ring-slate-500/20",
                      };
                      const status = (payment.payment_status || "").toLowerCase();
                      const patientName =
                        `${payment.patient?.first_name || ""} ${payment.patient?.last_name || ""}`.trim() || "Unknown";
                      const doctorName = payment.appointment?.doctor?.user?.name || "—";
                      return (
                        <tr key={payment.id} className="text-slate-700 transition-colors hover:bg-slate-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {payment.patient?.avatar_url ? (
                                <img
                                  src={payment.patient.avatar_url}
                                  alt={patientName}
                                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTint(
                                    patientName
                                  )}`}
                                >
                                  {initialsOf(patientName)}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">{patientName}</p>
                                <p className="truncate text-xs text-slate-400">Dr. {doctorName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${method.tint}`}
                            >
                              {method.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                                PAYMENT_STATUS_STYLES[status] || PAYMENT_STATUS_STYLES.pending
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {payment.payment_status || status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold text-slate-900">
                            {currency(payment.amount)}
                          </td>
                          <td className="py-3 text-xs text-slate-400">
                            {payment.payment_date
                              ? new Date(payment.payment_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={Wallet}
                  title="No recent payments"
                  description="Once payments are recorded they'll be listed here."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointments + inventory */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent appointments</h2>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {recentAppointments.length > 0 && (
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={apptSearch}
                  onChange={(e) => setApptSearch(e.target.value)}
                  placeholder="Search patient or doctor…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                      statusFilter === s
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredAppointments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">Patient</th>
                    <th className="pb-3 pr-4 font-semibold">Doctor</th>
                    <th className="pb-3 pr-4 font-semibold">Time</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.slice(0, visibleRows).map((appt) => {
                    const status = (appt.status || "").toLowerCase();
                    const patientName =
                      `${appt.patient?.first_name || ""} ${appt.patient?.last_name || ""}`.trim() || "Unknown";
                    const doctorName = appt.doctor?.user?.name || appt.doctor_name || "—";
                    const apptTime = appt.appointment_time || appt.time || "—";
                    return (
                      <tr key={appt.id} className="text-slate-700 transition-colors hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {appt.patient?.avatar_url ? (
                              <img
                                src={appt.patient.avatar_url}
                                alt={patientName}
                                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTint(
                                  patientName
                                )}`}
                              >
                                {initialsOf(patientName)}
                              </span>
                            )}
                            <span className="font-medium text-slate-900">{patientName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{doctorName}</td>
                        <td className="py-3 pr-4 text-slate-500">{apptTime}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              STATUS_STYLES[status] || STATUS_STYLES.completed
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {appt.status}
                          </span>
                        </td>
                        <td className="relative py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === appt.id ? null : appt.id);
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === appt.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
                            >
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Eye size={14} /> View details
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Check size={14} /> Mark completed
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              >
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredAppointments.length > visibleRows && (
                <button
                  type="button"
                  onClick={() => setVisibleRows((n) => n + 5)}
                  className="mt-3 w-full rounded-lg border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Show more ({filteredAppointments.length - visibleRows} remaining)
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={recentAppointments.length > 0 ? Search : CalendarX2}
                title={recentAppointments.length > 0 ? "No matching appointments" : "No recent appointments"}
                description={
                  recentAppointments.length > 0
                    ? "Try a different search term or status filter."
                    : "New bookings will show up here as soon as they're scheduled."
                }
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Status breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <h2 className="text-base font-bold text-slate-900">Status breakdown</h2>
            <p className="text-xs text-slate-500">Loaded appointments by status</p>
            {statusBreakdown.length > 0 ? (
              <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_HEX[entry.name] || "#cbd5e1"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {statusBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 capitalize text-slate-600">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: STATUS_HEX[entry.name] || "#cbd5e1" }}
                        />
                        {entry.name}
                      </span>
                      <span className="font-semibold text-slate-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-center text-xs text-slate-400">No appointment data yet.</p>
            )}
          </div>

          {/* Top doctors */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Busiest doctors</h2>
              <Award size={16} className="text-slate-300" />
            </div>
            <p className="text-xs text-slate-500">By loaded appointments</p>
            <div className="mt-3 space-y-2.5">
              {topDoctors.length > 0 ? (
                topDoctors.map((doc, i) => (
                  <div key={doc.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTint(
                        doc.name
                      )}`}
                    >
                      {initialsOf(doc.name) || i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-700">{doc.name}</span>
                    <span className="text-xs font-semibold text-slate-400">{doc.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400">No doctor data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory alerts */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Inventory alerts</h2>
            {lowStock.length > 0 && (
              <p className="text-xs text-slate-500">
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} running low
                {criticalStock > 0 ? `, ${criticalStock} critical` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/medicines"
              className="hidden text-xs font-semibold text-blue-600 hover:text-blue-700 sm:inline-flex sm:items-center sm:gap-1"
            >
              Manage inventory <ChevronRight size={12} />
            </Link>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Pill size={18} />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {lowStock.length > 0 ? (
            lowStock.map((item) => {
              const critical = Number(item.quantity) <= 3;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                    critical
                      ? "border-rose-200 bg-rose-50 hover:bg-rose-100/70"
                      : "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {critical && <AlertTriangle size={14} className="shrink-0 text-rose-600" />}
                    <p className="font-semibold text-slate-900">{item.name}</p>
                  </div>
                  <p className={`text-sm font-medium ${critical ? "text-rose-700" : "text-amber-700"}`}>
                    {item.quantity} {item.unit || "units"}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={Check}
                title="Stock levels look good"
                description="No medicines are running low right now."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}