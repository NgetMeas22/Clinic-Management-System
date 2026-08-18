import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Banknote,
  BriefcaseMedical,
  Building2,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  Pill,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLocale } from "../../../context/LocaleContext";
import { canVisit } from "../../../utils/permissions";

// Nav items are grouped so the sidebar reads as sections of the clinic
// workflow rather than one long flat list.
const NAV_GROUPS = (t) => [
  {
    label: t("nav.overview"),
    items: [{ name: t("nav.dashboard"), icon: LayoutGrid, to: "/dashboard" }],
  },
  {
    label: t("nav.facility"),
    items: [
      { name: t("nav.departments"), icon: Building2, to: "/departments" },
      { name: t("nav.doctors"), icon: Stethoscope, to: "/doctors" },
      { name: t("nav.users"), icon: UserCog, to: "/users" },
    ],
  },
  {
    label: t("nav.patientCare"),
    items: [
      { name: t("nav.patients"), icon: Users, to: "/patients" },
      { name: t("nav.appointments"), icon: Calendar, to: "/appointments" },
      { name: t("nav.medicalRecords"), icon: FileText, to: "/medical-records" },
      { name: t("nav.prescriptions"), icon: ShieldCheck, to: "/prescriptions" },
    ],
  },
  {
    label: t("nav.pharmacy"),
    items: [
      { name: t("nav.medicines"), icon: Pill, to: "/medicines" },
      { name: t("nav.inventory"), icon: BriefcaseMedical, to: "/inventory" },
    ],
  },
  {
    label: t("nav.finance"),
    items: [
      { name: t("nav.payments"), icon: Banknote, to: "/payments" },
      { name: t("nav.billing"), icon: Banknote, to: "/billing" },
      { name: t("nav.reports"), icon: FileText, to: "/reports" },
    ],
  },
];

const BOTTOM_NAV_ITEMS = (t) => [
  { name: t("nav.profile"), icon: UserRound, to: "/profile" },
  { name: t("nav.settings"), icon: Settings, to: "/settings" },
  { name: t("nav.support"), icon: HelpCircle, to: "/support" },
];

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function Sidebar({ onCollapseChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarErrorSrc, setAvatarErrorSrc] = useState(null);
  const { user, logout } = useAuth();
  const { t, localizedPath } = useLocale();
  const userMenuRef = useRef(null);

  const avatarSrc =
    user?.avatar_url || user?.avatar || user?.profile_picture || user?.image || "";

  const avatarVisible = Boolean(avatarSrc) && avatarErrorSrc !== avatarSrc;

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS(t).map((group) => ({
      ...group,
      items: group.items.filter((item) => canVisit(user, item.to)),
    })).filter((group) => group.items.length > 0);
  }, [user, t]);

  const visibleBottomItems = useMemo(
    () => BOTTOM_NAV_ITEMS(t).filter((item) => canVisit(user, item.to)),
    [user, t]
  );

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return visibleGroups
      .flatMap((group) => group.items)
      .filter((item) => item.name.toLowerCase().includes(q));
  }, [query, visibleGroups]);

  // Close the user menu on outside click.
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Confirm before signing out so a stray click doesn't kill the session.
  function handleSignOut() {
    setUserMenuOpen(false);
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      logout?.();
    }
  }

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
      collapsed ? "justify-center px-2.5" : "px-3.5"
    } ${
      isActive
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  function NavItem({ item }) {
    const Icon = item.icon;
    return (
      <NavLink
        to={localizedPath(item.to)}
        onClick={() => setIsOpen(false)}
        className={linkClass}
        title={collapsed ? item.name : undefined}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
            )}
            <Icon size={19} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.name}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-slate-700">
                {item.name}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <>
      {/* Mobile top bar toggle — X sits on the right so it is thumb-friendly */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-md transition-transform active:scale-95 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${
          isOpen ? "right-4" : "left-4"
        }`}
        aria-label={t("nav.toggleNav")}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-dvh flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 will-change-transform dark:border-slate-800 dark:bg-slate-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "w-72 lg:w-64"} max-w-[85vw]`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Brand */}
          <div className={`flex items-center gap-2 px-4 pb-4 pt-6 ${collapsed ? "flex-col justify-center" : "justify-between"}`}>
            <Link
              to={localizedPath("/dashboard")}
              onClick={() => setIsOpen(false)}
              className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
                <BriefcaseMedical size={22} strokeWidth={2.3} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-blue-700 dark:text-blue-300">
                    NGMClinic
                  </h1>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Medical System
                  </p>
                </div>
              )}
            </Link>
            {/* Collapse toggle: only shown on the collapsed-state's own row so it
                never overlaps the brand mark, and gets its own spacing below it. */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`hidden shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:flex lg:items-center lg:justify-center dark:hover:bg-slate-800 dark:hover:text-slate-200 ${collapsed ? "mt-1" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder={t("nav.searchMenu")}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
                />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
            {searchResults ? (
              <div className="space-y-1">
                {searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-slate-400">{t("nav.noMatches", { query })}</p>
                ) : (
                  searchResults.map((item) => <NavItem key={item.to} item={item} />)
                )}
              </div>
            ) : (
              visibleGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  {!collapsed && (
                    <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              ))
            )}
          </nav>
        </div>

        {/* Bottom section */}
      <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="space-y-1">
            {visibleBottomItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>

          {/* User card */}
          <div ref={userMenuRef} className="relative border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-bold text-white">
                  {avatarVisible ? (
                    <img
                      src={avatarSrc}
                      alt={user?.name || "Profile"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarErrorSrc(avatarSrc)}
                    />
                  ) : (
                    <span>{initialsOf(user?.name)}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user?.name || "Guest User"}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-400">{user?.role || "Staff"}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {userMenuOpen && !collapsed && (
              <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <Link
                  to={localizedPath("/profile")}
                  onClick={() => {
                    setUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                  className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t("nav.viewProfile")}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut size={15} />
                  {t("nav.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
