import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  LogOut,
  MessageSquare,
  Moon,
  PackageX,
  Pill,
  Search,
  Settings,
  Stethoscope,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import AiChatModal from "../../AiChatModal";
import { useTheme } from "../../../context/ThemeContext";
import { useLocale } from "../../../context/LocaleContext";
import LanguageSwitcher from "../../LanguageSwitcher";
import api from "../../../services/api";

// Fallback data so the panel has something to show out of the box. Pass a
// real `notifications` prop from the parent once there's an API for it —
// same shape: { id, type, title, detail, time, unread }.
const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: "appointment",
    title: "Appointment in 30 minutes",
    detail: "Sarah Chen · Room 204",
    time: "9:30 AM",
    unread: true,
  },
  {
    id: 2,
    type: "inventory",
    title: "Amoxicillin running low",
    detail: "12 units left in Pharmacy stock",
    time: "1h ago",
    unread: true,
  },
  {
    id: 3,
    type: "message",
    title: "New message from Dr. Patel",
    detail: "Re: lab results for patient #4821",
    time: "Yesterday",
    unread: false,
  },
];
const NOTIF_ICONS = {
  appointment: { Icon: CalendarClock, className: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  inventory: { Icon: PackageX, className: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
  message: { Icon: MessageSquare, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
};

const SEARCH_ICONS = {
  patient: { Icon: Users, className: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  doctor: { Icon: Stethoscope, className: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
  medicine: { Icon: Pill, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  appointment: { Icon: CalendarClock, className: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
};

function pageTitleFromPath(pathname, t) {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return t("page.dashboard");
  const translated = t(`page.${segment}`);
  if (translated !== `page.${segment}`) return translated;
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Navbar({ user, onLogout, title = "NGM Clinic", notifications = DEFAULT_NOTIFICATIONS }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarErrorSrc, setAvatarErrorSrc] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [notifList, setNotifList] = useState(notifications);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState({
    patients: [],
    doctors: [],
    medicines: [],
    appointments: [],
  });

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const searchTimerRef = useRef(null);

  const themeState = useTheme();
  const theme = themeState?.theme || "light";
  const toggleTheme = themeState?.toggleTheme || (() => {});

  const { t, localizedPath } = useLocale();
  const navigate = useNavigate();

  const location = useLocation();
  const pageTitle = pageTitleFromPath(location.pathname, t);

  const unreadCount = notifList.filter((n) => n.unread).length;

  // Global search: query patients, doctors, medicines and appointments.
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const q = searchQuery.trim();

    searchTimerRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setSearchResults({ patients: [], doctors: [], medicines: [], appointments: [] });
        setSearchLoading(false);
        setActiveIndex(0);
        return;
      }

      setSearchLoading(true);
      try {
        const [patientsRes, doctorsRes, medicinesRes, appointmentsRes] = await Promise.allSettled([
          api.get("/patients", { params: { search: q } }),
          api.get("/doctors", { params: { search: q } }),
          api.get("/medicines", { params: { search: q } }),
          api.get("/appointments", { params: { search: q } }),
        ]);

        const extract = (res) =>
          res.status === "fulfilled"
            ? res.value?.data?.data?.data || res.value?.data?.data || res.value?.data || []
            : [];

        setSearchResults({
          patients: extract(patientsRes),
          doctors: extract(doctorsRes),
          medicines: extract(medicinesRes),
          appointments: extract(appointmentsRes),
        });
        setActiveIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults({ patients: [], doctors: [], medicines: [], appointments: [] });
        setActiveIndex(0);
      } finally {
        setSearchLoading(false);
      }
    }, q.length < 2 ? 0 : 350);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const totalResults =
    searchResults.patients.length +
    searchResults.doctors.length +
    searchResults.medicines.length +
    searchResults.appointments.length;

  // Close dropdowns on outside click.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape closes whatever's open, modal takes priority.
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      if (showLogoutModal) setShowLogoutModal(false);
      else {
        setMenuOpen(false);
        setNotifOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLogoutModal]);

  // Small elevation cue once the page has scrolled under the sticky header.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and animate the modal in while it's open.
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setModalVisible(true));
      const focusTimer = setTimeout(() => cancelBtnRef.current?.focus(), 50);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(focusTimer);
      };
    } else {
      document.body.style.overflow = "";
      const raf = requestAnimationFrame(() => setModalVisible(false));

      return () => cancelAnimationFrame(raf);
    }
  }, [showLogoutModal]);

  const initials = (user?.name || title)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc =
    user?.avatar_url || user?.avatar || user?.profile_picture || user?.image || "";

  const avatarVisible = Boolean(avatarSrc) && avatarErrorSrc !== avatarSrc;

  const handleOpenLogoutModal = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const markAllRead = () => setNotifList((list) => list.map((n) => ({ ...n, unread: false })));

  const searchGroups = [
    {
      key: "patients",
      label: t("navbar.searchPatients"),
      to: "/patients",
      items: searchResults.patients.map((p) => ({
        id: p.id,
        label: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.name || "Patient",
        sub: p.patient_code || p.phone || "",
        avatar: p.avatar_url,
      })),
    },
    {
      key: "doctors",
      label: t("navbar.searchDoctors"),
      to: "/doctors",
      items: searchResults.doctors.map((d) => ({
        id: d.id,
        label: d.user?.name || d.name || d.full_name || "Doctor",
        sub: d.specialization || d.speciality || "",
        avatar: d.avatar_url,
      })),
    },
    {
      key: "medicines",
      label: t("navbar.searchMedicines"),
      to: "/medicines",
      items: searchResults.medicines.map((m) => ({
        id: m.id,
        label: m.name || "Medicine",
        sub: m.category || "",
        avatar: null,
      })),
    },
    {
      key: "appointments",
      label: t("navbar.searchAppointments"),
      to: "/appointments",
      items: searchResults.appointments.map((a) => ({
        id: a.id,
        label: `${a.patient?.first_name || ""} ${a.patient?.last_name || ""}`.trim() || "Appointment",
        sub: `${a.appointment_date || ""} ${a.appointment_time ? `· ${a.appointment_time.substring(0, 5)}` : ""}`.trim(),
        avatar: a.patient?.avatar_url,
      })),
    },
  ].filter((group) => group.items.length > 0);

  const flatResults = useMemo(() => {
    const flat = [];
    searchGroups.forEach((group) => {
      group.items.slice(0, 5).forEach((item) => {
        flat.push({ group, item });
      });
    });
    return flat;
  }, [searchGroups]);

  const clampedActiveIndex = flatResults.length ? activeIndex % flatResults.length : 0;

  const goToSearchResult = (path, query) => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveIndex(0);
    const target = localizedPath(query ? `${path}?search=${encodeURIComponent(query)}` : path);
    navigate(target);
  };

  const handleSearchKeyDown = (e) => {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatResults.length) setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatResults.length)
        setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      if (flatResults.length) {
        e.preventDefault();
        const current = flatResults[clampedActiveIndex] || flatResults[0];
        goToSearchResult(current.group.to, searchQuery);
      }
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md transition-shadow dark:bg-slate-900/80 ${
          scrolled
            ? "border-slate-200 shadow-sm dark:border-slate-800"
            : "border-slate-200/80 dark:border-slate-800/80"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">

          {/* Page context: current section, matched to the sidebar's naming */}
          <div className="hidden min-w-0 flex-col sm:flex">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>{title}</span>
              <ChevronRight size={12} />
            </div>
            <h2 className="truncate text-[15px] font-bold leading-tight text-slate-800 dark:text-slate-100">
              {pageTitle}
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xs flex-1 sm:max-w-sm" ref={searchRef}>
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
            />
<input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("navbar.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
            />
            {searchLoading && searchQuery.trim().length >= 2 && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              </span>
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {searchOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-96 overflow-y-auto p-1.5">
                  {searchLoading && searchQuery.trim().length >= 2 ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      {t("common.loading")}
                    </div>
                  ) : !searchQuery.trim() || searchQuery.trim().length < 2 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">
                      {t("common.search")}…
                    </p>
                  ) : totalResults === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">
                      {t("navbar.noResults", { query: searchQuery })}
                    </p>
                  ) : (
                    (() => {
                      let offset = 0;
                      return (
                        <>
                          {searchGroups.map((group) => {
                            const { Icon, className } = SEARCH_ICONS[group.key];
                            const groupStart = offset;
                            const items = group.items.slice(0, 5);
                            offset += items.length;
                            return (
                              <div key={group.key} className="mb-1 last:mb-0">
                                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  <Icon size={12} className={className} />
                                  {group.label}
                                  <span className="ml-auto text-[10px] font-medium text-slate-300 dark:text-slate-500">
                                    {group.items.length}
                                  </span>
                                </p>
                                {items.map((item, i) => {
                                  const itemIndex = groupStart + i;
                                  const isActive = itemIndex === clampedActiveIndex;
                                  return (
                                    <button
                                      key={`${group.key}-${item.id}`}
                                      onMouseEnter={() => setActiveIndex(itemIndex)}
                                      onClick={() => goToSearchResult(group.to, searchQuery)}
                                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                                        isActive
                                          ? "bg-blue-50 dark:bg-blue-950/40"
                                          : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                      }`}
                                    >
                                      {item.avatar ? (
                                        <img
                                          src={item.avatar}
                                          alt={item.label}
                                          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                        />
                                      ) : (
                                        <div
                                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}
                                        >
                                          <Icon size={15} />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                          {item.label}
                                        </p>
                                        {item.sub && (
                                          <p className="truncate text-xs text-slate-400">{item.sub}</p>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => goToSearchResult(group.to, searchQuery)}
                                  className="mt-0.5 flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                  {t("navbar.viewAll", { label: group.label })}
                                </button>
                              </div>
                            );
                          })}
                          <p className="mt-1 border-t border-slate-100 pt-2 text-center text-[11px] text-slate-300 dark:border-slate-800 dark:text-slate-500">
                            {totalResults} {t("navbar.resultsHint").toLowerCase()} &middot;{" "}
                            {t("navbar.keyboardHint")}
                          </p>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons & User Menu */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">

            {/* Language toggle */}
            <LanguageSwitcher />

            {/* AI Assistant */}
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="rounded-xl p-2.5 text-blue-600 transition-colors hover:bg-blue-50 active:scale-95 dark:text-blue-400 dark:hover:bg-blue-950/40"
              title={t("ai.title")}
            >
              <Bot size={19} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((open) => !open)}
                className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title={t("navbar.notifications")}
                aria-expanded={notifOpen}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("navbar.notifications")}</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {t("navbar.markAllRead")}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifList.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-400">{t("navbar.allCaughtUp")}</p>
                    ) : (
                      notifList.map((n) => {
                        const { Icon, className } = NOTIF_ICONS[n.type] || NOTIF_ICONS.message;
                        return (
                          <div
                            key={n.id}
                            className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {n.title}
                                </p>
                                {n.unread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                              </div>
                              <p className="truncate text-xs text-slate-400">{n.detail}</p>
                              <p className="mt-0.5 text-[11px] text-slate-300 dark:text-slate-500">{n.time}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
              title={theme === "dark" ? t("navbar.switchLight") : t("navbar.switchDark")}
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-slate-600" />
              )}
              <span className="hidden capitalize sm:inline">{theme}</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="group flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/70"
                aria-expanded={menuOpen}
              >
                <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm ring-2 ring-white transition-transform group-hover:scale-105 dark:ring-slate-900">
                  {avatarVisible ? (
                    <img
                      src={avatarSrc}
                      alt={user?.name || title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarErrorSrc(avatarSrc)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="hidden text-left md:block">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {user?.name || title}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {user?.role || "User"}
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user?.name || title}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      {user?.email || "user@ngmclinic.com"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to={localizedPath("/profile")}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <UserRound size={16} className="text-slate-400" />
                      {t("nav.profile")}
                    </Link>

                    <Link
                      to={localizedPath("/settings")}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <Settings size={16} className="text-slate-400" />
                      {t("nav.settings")}
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      onClick={handleOpenLogoutModal}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={16} />
                      {t("nav.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AI Chat Modal */}
      <AiChatModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-opacity duration-200 ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowLogoutModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div
            className={`relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-7 ${
              modalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            {/* Icon Badge */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-950/20">
              <AlertTriangle size={26} />
            </div>

            {/* Text Context */}
            <div className="mt-5 text-center">
              <h3 id="logout-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("logout.title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {t("logout.message")}
              </p>

              {/* Who's signing out, for extra confidence on shared workstations */}
              <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 dark:bg-slate-800/70">
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 text-[10px] font-bold text-white">
                  {avatarVisible ? (
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {user?.name || title}
                </span>
              </div>
            </div>

            {/* Full-width Stacked Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-500"
              >
                {t("logout.confirm")}
              </button>
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("logout.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
