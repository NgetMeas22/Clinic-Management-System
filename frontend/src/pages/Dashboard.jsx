import { useState, useMemo } from "react";
import {
  Users,
  Stethoscope,
  Calendar,
  Banknote,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  MoreVertical,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

const COLORS = {
  ink: "#101E2C",
  slate: "#66738A",
  slateLight: "#94A0B4",
  bg: "#F4F6F8",
  card: "#FFFFFF",
  border: "#E5E9EE",
  teal: "#2563EB",
  tealSoft: "#EFF6FF",
  tealDeep: "#1D4ED8",
  green: "#10B981",
  greenSoft: "#ECFDF5",
  coral: "#E11D48",
  coralSoft: "#FFF1F2",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  violet: "#2563EB",
  violetSoft: "#EFF6FF",
};

export default function Dashboard({ onNavigateToAppointments }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  const stats = [
    {
      title: "Total patients",
      value: "1,248",
      change: "+12%",
      trend: "up",
      icon: Users,
      accent: COLORS.teal,
      accentSoft: COLORS.tealSoft,
    },
    {
      title: "Total doctors",
      value: "48",
      change: "No change",
      trend: "flat",
      icon: Stethoscope,
      accent: COLORS.teal,
      accentSoft: COLORS.tealSoft,
    },
    {
      title: "Appointments today",
      value: "32",
      change: "-4%",
      trend: "down",
      icon: Calendar,
      accent: COLORS.teal,
      accentSoft: COLORS.tealSoft,
    },
    {
      title: "Total revenue",
      value: "$12.5K",
      change: "+8%",
      trend: "up",
      icon: Banknote,
      accent: COLORS.teal,
      accentSoft: COLORS.tealSoft,
    },
  ];

  const visitsData = [
    { month: "Jan", visits: 620 },
    { month: "Feb", visits: 780 },
    { month: "Mar", visits: 910 },
    { month: "Apr", visits: 860 },
    { month: "May", visits: 1040 },
    { month: "Jun", visits: 960 },
  ];

  const revenueData = [
    { quarter: "Q1", revenue: 8.4 },
    { quarter: "Q2", revenue: 11.2 },
    { quarter: "Q3", revenue: 9.6 },
    { quarter: "Q4", revenue: 12.5 },
  ];

  const departments = [
    { name: "Cardiology", patients: 312, pct: 25, color: "#1D4ED8" },
    { name: "Neurology", patients: 248, pct: 20, color: "#2563EB" },
    { name: "Pediatrics", patients: 274, pct: 22, color: "#3B82F6" },
    { name: "Dermatology", patients: 199, pct: 16, color: "#60A5FA" },
    { name: "Orthopedics", patients: 215, pct: 17, color: "#93C5FD" },
  ];

  const doctorAvailability = [
    { name: "Dr. Sarah Johnson", dept: "Cardiology", status: "Available", initials: "SJ" },
    { name: "Dr. Michael Chang", dept: "Dermatology", status: "In session", initials: "MC" },
    { name: "Dr. Amanda Lewis", dept: "Neurology", status: "Available", initials: "AL" },
    { name: "Dr. James Okafor", dept: "Pediatrics", status: "Off duty", initials: "JO" },
  ];

  const initialAppointments = [
    {
      id: 1,
      patientName: "Marcus Rossi",
      patientPhone: "+1 (555) 019-2834",
      initials: "MR",
      doctor: "Dr. Sarah Johnson",
      department: "Cardiology",
      time: "09:00 AM",
      status: "Confirmed",
    },
    {
      id: 2,
      patientName: "Emily Chen",
      patientPhone: "+1 (555) 012-9921",
      initials: "EC",
      doctor: "Dr. Michael Chang",
      department: "Dermatology",
      time: "10:30 AM",
      status: "Pending",
    },
    {
      id: 3,
      patientName: "Robert Taylor",
      patientPhone: "+1 (555) 017-4402",
      initials: "RT",
      doctor: "Dr. Amanda Lewis",
      department: "Neurology",                                                                                    
      time: "11:15 AM",
      status: "Completed",
    },
    {
      id: 4,
      patientName: "Sophia Martinez",
      patientPhone: "+1 (555) 018-3310",
      initials: "SM",
      doctor: "Dr. Sarah Johnson",
      department: "Cardiology",
      time: "02:00 PM",
      status: "Cancelled",
    },
  ];

  const statusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return { bg: COLORS.tealSoft, fg: COLORS.tealDeep };
      case "completed":
        return { bg: COLORS.greenSoft, fg: "#136B48" };
      case "pending":
        return { bg: COLORS.amberSoft, fg: "#8C5A14" };
      case "cancelled":
        return { bg: COLORS.coralSoft, fg: "#A5342A" };
      default:
        return { bg: "#EEF0F3", fg: COLORS.slate };
    }
  };

  const filteredAppointments = useMemo(() => {
    return initialAppointments.filter((app) => {
      const q = searchTerm.toLowerCase();
      return (
        app.patientName.toLowerCase().includes(q) ||
        app.doctor.toLowerCase().includes(q) ||
        app.department.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: COLORS.ink,
      }}
      className="p-6 md:p-8 space-y-6"
    >
      <style>{FONTS}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1
              style={{ fontWeight: 700 }}
              className="text-3xl text-slate-900"
            >
              Dashboard
            </h1>
            <PulseBadge />
          </div>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">
            {today} · Here is today's clinical overview.
          </p>
        </div>
        <button
          onClick={onNavigateToAppointments}
          style={{ background: COLORS.teal }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 hover:opacity-90 text-white font-semibold text-sm rounded-lg shadow-sm transition-opacity"
        >
          <Plus size={18} />
          <span>New appointment</span>
        </button>
      </div>

      <PulseDivider />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;
          const trendColor =
            stat.trend === "up" ? COLORS.green : stat.trend === "down" ? COLORS.coral : COLORS.slate;
          const trendBg =
            stat.trend === "up" ? COLORS.greenSoft : stat.trend === "down" ? COLORS.coralSoft : "#EEF0F3";
          return (
            <div
              key={idx}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              className="p-5 rounded-xl shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span
                  style={{ color: COLORS.slateLight, letterSpacing: "0.06em" }}
                  className="text-[11px] font-bold uppercase"
                >
                  {stat.title}
                </span>
                <div
                  style={{ background: stat.accentSoft, color: stat.accent }}
                  className="p-2.5 rounded-lg"
                >
                  <Icon size={18} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div
                  style={{ fontWeight: 700 }}
                  className="text-[28px] leading-none text-slate-900"
                >
                  {stat.value}
                </div>
                <div
                  style={{ background: trendBg, color: trendColor }}
                  className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                >
                  <TrendIcon size={12} className="mr-1" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          className="lg:col-span-2 rounded-xl shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                style={{ fontWeight: 700 }}
                className="text-base text-slate-900"
              >
                Patient visits
              </h2>
              <p style={{ color: COLORS.slate }} className="text-xs mt-0.5">
                Volume trend across the last 6 months
              </p>
            </div>
            <span
              style={{ background: COLORS.tealSoft, color: COLORS.tealDeep }}
              className="text-xs font-semibold px-3 py-1 rounded-full"
            >
              Last 6 months
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: COLORS.slate, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: COLORS.slateLight, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip unit=" visits" />} />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke={COLORS.teal}
                  strokeWidth={2.5}
                  fill="url(#visitFill)"
                  dot={{ r: 3, fill: COLORS.teal, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          className="rounded-xl shadow-sm p-5"
        >
          <h2
            style={{ fontWeight: 700 }}
            className="text-base text-slate-900"
          >
            Revenue trend
          </h2>
          <p style={{ color: COLORS.slate }} className="text-xs mt-0.5 mb-4">
            Quarterly revenue, in thousands
          </p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 12, fill: COLORS.slate, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: COLORS.slateLight, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip unit="K" />} cursor={{ fill: COLORS.tealSoft }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill={COLORS.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          className="rounded-xl shadow-sm p-5"
        >
          <h2
            style={{ fontWeight: 700 }}
            className="text-base text-slate-900 mb-4"
          >
            Department overview
          </h2>
          <div className="space-y-3.5">
            {departments.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{d.name}</span>
                  <span
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.slate }}
                    className="text-xs"
                  >
                    {d.patients} · {d.pct}%
                  </span>
                </div>
                <div style={{ background: "#EEF0F3" }} className="h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${d.pct * 3}%`, background: d.color }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          className="rounded-xl shadow-sm p-5"
        >
          <h2
            style={{ fontWeight: 700 }}
            className="text-base text-slate-900 mb-4"
          >
            Doctor availability
          </h2>
          <div className="space-y-1">
            {doctorAvailability.map((doc) => {
              const s =
                doc.status === "Available"
                  ? { bg: COLORS.greenSoft, fg: "#136B48" }
                  : doc.status === "In session"
                  ? { bg: COLORS.amberSoft, fg: "#8C5A14" }
                  : { bg: "#EEF0F3", fg: COLORS.slate };
              return (
                <div
                  key={doc.name}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ background: COLORS.tealSoft, color: COLORS.tealDeep }}
                      className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                    >
                      {doc.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{doc.name}</div>
                      <div style={{ color: COLORS.slate }} className="text-xs">
                        {doc.dept}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{ background: s.bg, color: s.fg }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {doc.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        className="p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              style={{ color: COLORS.slateLight }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search today's schedule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.slate }}
            className="p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Appointments table */}
      <div
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        className="rounded-xl shadow-sm overflow-hidden"
      >
        <div
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
          className="p-4 sm:p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div>
              <h2
                style={{ fontWeight: 700 }}
                className="text-base text-slate-900"
              >
                Today's schedule
              </h2>
              <p style={{ color: COLORS.slate }} className="text-xs mt-0.5">
                Live updates for today's active appointments
              </p>
            </div>
            <PulseBadge />
          </div>
          <button
            onClick={onNavigateToAppointments}
            style={{ color: COLORS.teal }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                style={{ background: "#FAFBFC", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.slateLight }}
                className="text-[11px] font-bold tracking-wider uppercase"
              >
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6">Time</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ color: COLORS.slate }} className="py-12 text-center">
                    No scheduled appointments found for today.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((item) => {
                  const s = statusStyle(item.status);
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: `1px solid ${COLORS.border}` }}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ background: COLORS.tealSoft, color: COLORS.tealDeep }}
                            className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                          >
                            {item.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.patientName}</div>
                            <div
                              style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.slateLight }}
                              className="text-xs"
                            >
                              {item.patientPhone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div style={{ color: COLORS.teal }} className="font-semibold">
                          {item.doctor}
                        </div>
                        <div style={{ color: COLORS.slateLight }} className="text-xs">
                          {item.department}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock size={14} style={{ color: COLORS.slateLight }} />
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.time}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          style={{ background: s.bg, color: s.fg }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                          style={{ color: COLORS.slateLight }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === item.id && (
                          <div
                            style={{ border: `1px solid ${COLORS.border}` }}
                            className="absolute right-6 top-12 w-32 bg-white rounded-lg shadow-lg py-1 z-20 text-left"
                          >
                            <button
                              onClick={() => setActiveMenuId(null)}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{ borderTop: `1px solid ${COLORS.border}` }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white"
        >
          <div style={{ color: COLORS.slate }} className="text-sm">
            Showing <span className="font-semibold text-slate-800">1</span> to{" "}
            <span className="font-semibold text-slate-800">{filteredAppointments.length}</span> of{" "}
            <span className="font-semibold text-slate-800">{initialAppointments.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.slateLight }}
              className="p-2 rounded-lg disabled:opacity-50 cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              style={{ background: COLORS.teal }}
              className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center"
            >
              1
            </button>
            <button
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.slate }}
              className="p-2 rounded-lg hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: COLORS.ink,
        color: "#fff",
        padding: "6px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ opacity: 0.7, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>
        {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

function PulseBadge() {
  return (
    <span
      style={{ background: COLORS.greenSoft, color: "#136B48" }}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full"
    >
      <span style={{ position: "relative", width: 6, height: 6, display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: COLORS.green,
            animation: "pulseDot 1.6s ease-out infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: COLORS.green,
          }}
        />
      </span>
      Live
      <style>{`@keyframes pulseDot { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(3.2); opacity: 0; } }`}</style>
    </span>
  );
}

function PulseDivider() {
  return (
    <div style={{ width: "100%", height: 22, overflow: "hidden" }}>
      <svg width="100%" height="22" viewBox="0 0 1200 22" preserveAspectRatio="none">
        <line x1="0" y1="11" x2="1200" y2="11" stroke={COLORS.border} strokeWidth="1" />
        <polyline
          points="0,11 480,11 510,11 525,2 540,20 555,4 570,11 600,11 1200,11"
          fill="none"
          stroke={COLORS.teal}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}