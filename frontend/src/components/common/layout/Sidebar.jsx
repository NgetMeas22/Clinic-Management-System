import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Stethoscope,
  Calendar,
  Building2,
  FileText,
  Pill,
  Menu,
  X,
  BriefcaseMedical,
  Plus,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Main Nav Items
  const mainNavItems = [
    { name: "Dashboard", icon: LayoutGrid, to: "/dashboard" },
    { name: "Patients", icon: Users, to: "/patients" },
    { name: "Doctors", icon: Stethoscope, to: "/doctors" },
    { name: "Appointments", icon: Calendar, to: "/appointments" },
    { name: "Departments", icon: Building2, to: "/departments" },
    { name: "Medical Records", icon: FileText, to: "/medical-records" },
    { name: "Prescriptions", icon: Pill, to: "/prescriptions" },
  ];

  // Secondary Bottom Nav Items
  const bottomNavItems = [
    { name: "Settings", icon: Settings, to: "/settings" },
    { name: "Support", icon: HelpCircle, to: "/support" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border text-slate-600 hover:bg-slate-100"
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top & Navigation Section */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <BriefcaseMedical size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600 leading-tight">
                NGMClinic
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">
                Medical System
              </p>
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="mt-2 flex-1 space-y-1 px-3">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors relative ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-sm" />
                      )}
                      <Icon
                        size={20}
                        className={isActive ? "text-blue-600" : "text-slate-500"}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Primary Action & Secondary Links */}
        <div className="p-4 border-t border-slate-100 space-y-4 bg-white">
          {/* New Appointment Button */}
          <Link
            to="/appointments"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Appointment</span>
          </Link>

          {/* Settings & Support Links */}
          <div className="pt-2 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={isActive ? "text-blue-600" : "text-slate-500"}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}