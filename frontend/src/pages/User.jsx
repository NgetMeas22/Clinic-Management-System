import { ShieldCheck, UserCog, Stethoscope, Headset, Check, Eye, Minus, Info } from "lucide-react";

export default function User() {
  const roles = [
    {
      name: "Admin",
      icon: UserCog,
      accent: "indigo",
      summary: "Full system access, reports, users and all CRUD operations.",
      tags: ["Full CRUD", "User management", "Reports"],
    },
    {
      name: "Doctor",
      icon: Stethoscope,
      accent: "emerald",
      summary: "Clinical dashboard, own appointments, patients view, records, prescriptions and medicine read-only.",
      tags: ["Own appointments", "Patient records", "Read-only medicines"],
    },
    {
      name: "Receptionist",
      icon: Headset,
      accent: "amber",
      summary: "Front desk dashboard, patients, appointments, doctor/department lookup, medicines and payments.",
      tags: ["Scheduling", "Patient intake", "Payments"],
    },
  ];

  // access levels: full | edit | own | view | none
  const matrix = [
    { module: "Departments", admin: "full", doctor: "none", receptionist: "view" },
    { module: "Doctors", admin: "full", doctor: "view", receptionist: "view" },
    { module: "Patients", admin: "full", doctor: "view", receptionist: "full" },
    { module: "Appointments", admin: "full", doctor: "own", receptionist: "full" },
    { module: "Medical Records", admin: "full", doctor: "edit", receptionist: "none" },
    { module: "Prescriptions", admin: "full", doctor: "edit", receptionist: "none" },
    { module: "Medicines", admin: "full", doctor: "view", receptionist: "view" },
    { module: "Inventory", admin: "full", doctor: "none", receptionist: "none" },
    { module: "Payments", admin: "full", doctor: "none", receptionist: "full" },
    { module: "Billing", admin: "full", doctor: "none", receptionist: "view" },
    { module: "Reports", admin: "full", doctor: "none", receptionist: "none" },
    { module: "Users", admin: "full", doctor: "none", receptionist: "none" },
  ];

  const accentStyles = {
    indigo: {
      iconWrap: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      bar: "bg-indigo-500",
      tag: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
      dot: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      iconWrap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      bar: "bg-emerald-500",
      tag: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      dot: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      bar: "bg-amber-500",
      tag: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      dot: "text-amber-600 dark:text-amber-400",
    },
  };

  const AccessCell = ({ level, accent }) => {
    const map = {
      full: { icon: Check, label: "Full access", cls: `${accentStyles[accent].dot}` },
      edit: { icon: Check, label: "Create & edit", cls: `${accentStyles[accent].dot}` },
      own: { icon: Check, label: "Own records only", cls: `${accentStyles[accent].dot} opacity-70` },
      view: { icon: Eye, label: "View only", cls: "text-slate-400 dark:text-slate-500" },
      none: { icon: Minus, label: "No access", cls: "text-slate-300 dark:text-slate-700" },
    };
    const { icon: Icon, label, cls } = map[level];
    return (
      <div className="flex items-center justify-center" title={label}>
        <Icon size={16} className={cls} strokeWidth={2.5} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <ShieldCheck size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Users and Roles
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Role access is enforced by backend middleware and frontend route guards.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Info size={13} />
          Reference only — no user CRUD yet
        </span>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const style = accentStyles[role.accent];
          return (
            <div
              key={role.name}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <div className={`absolute inset-x-0 top-0 h-1 ${style.bar}`} />
              <div className="p-5 pt-6">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex rounded-lg p-2.5 ${style.iconWrap}`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {role.name}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {role.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {role.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${style.tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white">Access by module</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            What each role can see and do across the system.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">
                  Module
                </th>
                <th className="w-28 px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">
                  Admin
                </th>
                <th className="w-28 px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">
                  Doctor
                </th>
                <th className="w-28 px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">
                  Receptionist
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr
                  key={row.module}
                  className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                    i % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                    {row.module}
                  </td>
                  <td className="px-3 py-3">
                    <AccessCell level={row.admin} accent="indigo" />
                  </td>
                  <td className="px-3 py-3">
                    <AccessCell level={row.doctor} accent="emerald" />
                  </td>
                  <td className="px-3 py-3">
                    <AccessCell level={row.receptionist} accent="amber" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} /> Full or partial write access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} className="text-slate-400" /> View only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Minus size={13} className="text-slate-300 dark:text-slate-700" /> No access
          </span>
        </div>
      </div>

      {/* Footnote */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <p>
          User CRUD API is not present in this codebase yet, so this screen documents the active
          role matrix without adding fake controls.
        </p>
      </div>
    </div>
  );
}