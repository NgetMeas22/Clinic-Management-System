import { ShieldCheck, UserCog } from "lucide-react";

export default function User() {
  const roles = [
    { name: "Admin", access: "Full system access, reports, users and all CRUD operations." },
    { name: "Doctor", access: "Clinical dashboard, own appointments, patients view, records, prescriptions and medicine read-only." },
    { name: "Receptionist", access: "Front desk dashboard, patients, appointments, doctor/department lookup, medicines and payments." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          <UserCog size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users and Roles</h1>
          <p className="text-sm text-slate-500">
            Role access is enforced by backend middleware and frontend route guards.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <div key={role.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <ShieldCheck className="text-blue-600" size={22} />
            <h2 className="mt-3 font-bold text-slate-900 dark:text-white">{role.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{role.access}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        User CRUD API is not present in this codebase yet, so this screen documents the active role matrix without adding fake controls.
      </div>
    </div>
  );
}
