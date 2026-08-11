import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Banknote, BriefcaseMedical, Building2, Calendar, FileText, HelpCircle, LayoutGrid, Menu, Pill, Settings, ShieldCheck, Stethoscope, UserCog, UserRound, Users, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { canVisit } from "../../../utils/permissions";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const mainNavItems = [
    { name: "Dashboard", icon: LayoutGrid, to: "/dashboard" },
    { name: "Departments", icon: Building2, to: "/departments" },
    { name: "Doctors", icon: Stethoscope, to: "/doctors" },
    { name: "Patients", icon: Users, to: "/patients" },
    { name: "Appointments", icon: Calendar, to: "/appointments" },
    { name: "Medical Records", icon: FileText, to: "/medical-records" },
    { name: "Prescriptions", icon: ShieldCheck, to: "/prescriptions" },
    { name: "Medicines", icon: Pill, to: "/medicines" },
    { name: "Inventory", icon: BriefcaseMedical, to: "/inventory" },
    { name: "Payments", icon: Banknote, to: "/payments" },
    { name: "Billing", icon: Banknote, to: "/billing" },
    { name: "Reports", icon: FileText, to: "/reports" },
    { name: "Users", icon: UserCog, to: "/users" },
  ].filter((item) => canVisit(user, item.to));

  const bottomNavItems = [
    { name: "Profile", icon: UserRound, to: "/profile" },
    { name: "Settings", icon: Settings, to: "/settings" },
    { name: "Support", icon: HelpCircle, to: "/support" },
  ].filter((item) => canVisit(user, item.to));

  const linkClass = ({ isActive }) =>
    `relative flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-white p-2 text-slate-600 shadow-md lg:hidden"
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-6 py-6">
            <div className="rounded-lg bg-blue-600 p-2.5 text-white shadow-sm">
              <BriefcaseMedical size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-blue-600">NGMClinic</h1>
              <p className="text-xs font-semibold text-slate-500">Medical System</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.name} to={item.to} onClick={() => setIsOpen(false)} className={linkClass}>
                  <Icon size={19} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-slate-100 p-4 dark:border-slate-800">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.name} to={item.to} onClick={() => setIsOpen(false)} className={linkClass}>
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
}
