import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Calendar,
  Loader2,
  MoreVertical,
  Pill,
  Plus,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import dashboardService from "../services/dashboardService";
import medicineService from "../services/medicineService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [range, setRange] = useState("week");
  const [rangeCache, setRangeCache] = useState({});
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashboardRes, yearlyRes, weeklyRes, medicineRes] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getMonthly(),
          dashboardService.getWeekly(),
          medicineService.getAll(),
        ]);

        if (!mounted) return;

        setStats(dashboardRes.data || {});
        setMedicines(medicineRes.data || []);
        setRangeCache((prev) => ({
          ...prev,
          week: weeklyRes.data || {},
          year: yearlyRes.data || {},
        }));
      } catch (err) {
        console.error("Failed to load dashboard", err);
        if (mounted) setError("Dashboard data could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
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
  const recentAppointments = stats?.recent_appointments ?? [];

  const cards = [
    {
      label: "Total patients",
      value: (stats?.total_patients ?? 0).toLocaleString(),
      icon: Users,
      trend: stats?.total_patients_trend,
      tint: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total doctors",
      value: (stats?.total_doctors ?? 0).toLocaleString(),
      icon: Stethoscope,
      trend: stats?.total_doctors_trend,
      tint: "bg-violet-50 text-violet-600",
    },
    {
      label: "Appointments today",
      value: (stats?.appointments_today ?? 0).toLocaleString(),
      icon: Calendar,
      trend: stats?.appointments_today_trend,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total revenue",
      value: `$${Number(stats?.total_revenue || 0).toLocaleString()}`,
      icon: Banknote,
      trend: stats?.total_revenue_trend,
      tint: "bg-emerald-50 text-emerald-600",
    },
  ];

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back{user?.name ? `, ${user.name}` : ""}. Here's your {user?.role ? `${user.role} ` : ""}
            summary for today.
          </p>
        </div>
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <div className={`rounded-lg p-2 transition-transform duration-200 group-hover:scale-105 ${card.tint}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                <TrendBadge value={card.trend} />
              </div>
            </div>
          );
        })}
      </div>

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

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <h2 className="text-base font-bold text-slate-900">Revenue</h2>
          <p className="text-xs text-slate-500">
            Revenue {range === "year" ? "this year" : range === "month" ? "this month" : "this week"}
          </p>
          <div className="mt-4 h-72">
            {isChartLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
                    tickFormatter={compactNumber}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent appointments</h2>
            <Link to="/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all &rarr;
            </Link>
          </div>

          {recentAppointments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">Patient</th>
                    <th className="pb-3 pr-4 font-semibold">Doctor</th>
                    <th className="pb-3 pr-4 font-semibold">Time</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.slice(0, 5).map((appt) => {
                    const status = (appt.status || "").toLowerCase();
                    return (
                      <tr key={appt.id} className="text-slate-700 transition-colors hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {initialsOf(appt.patient_name)}
                            </span>
                            <span className="font-medium text-slate-900">{appt.patient_name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{appt.doctor_name}</td>
                        <td className="py-3 pr-4 text-slate-500">{appt.time}</td>
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
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No recent appointments to show.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Inventory alerts</h2>
            <Pill size={18} className="text-blue-600" />
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.length > 0 ? (
              lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 transition-colors hover:bg-amber-100/70"
                >
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm font-medium text-amber-700">
                    {item.quantity} {item.unit || "units"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No low-stock medicines right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}