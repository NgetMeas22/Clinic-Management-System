import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

export default function Navbar({ user, onLogout, title = "NGM Clinic" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  const themeState = useTheme();
  const theme = themeState?.theme || "light";
  const toggleTheme = themeState?.toggleTheme || (() => {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.name || title)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc =
    user?.avatar_url || user?.avatar || user?.profile_picture || user?.image || "";

  const handleOpenLogoutModal = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          
          {/* Search Bar */}
          <div className="relative hidden flex-1 sm:block sm:max-w-xs md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
            />
          </div>

          {/* Right Action Icons & User Menu */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <button
              className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
              >
                <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm ring-2 ring-white transition-transform group-hover:scale-105 dark:ring-slate-900">
                  {avatarSrc && !avatarError ? (
                    <img
                      src={avatarSrc}
                      alt={user?.name || title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
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
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <UserRound size={16} className="text-slate-400" />
                      Profile
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <Settings size={16} className="text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      onClick={handleOpenLogoutModal}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Custom Logout Confirmation Alert Modal (2 Buttons) */}
    {showLogoutModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      
      {/* Icon Badge */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-950/20">
        <AlertTriangle size={26} />
      </div>

      {/* Text Context */}
      <div className="mt-5 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Sign out of your account?
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          You will need to re-enter your credentials to access your dashboard and patient records.
        </p>
      </div>

      {/* Full-width Stacked Buttons */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleConfirmLogout}
          className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-500"
        >
          Yes, Log Out
        </button>
        <button
          type="button"
          onClick={() => setShowLogoutModal(false)}
          className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}
    </>
  );
}