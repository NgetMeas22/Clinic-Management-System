import { useState } from "react";
import { Search, Bell, Mail, Sun, ChevronDown } from "lucide-react";

export default function Navbar({ user, onLogout, title = "NGM Clinic" }) {
  const [theme, setTheme] = useState("Light");
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* Notifications Icon */}
          <button className="relative p-1.5 text-slate-700 hover:text-slate-900 transition-colors focus:outline-none">
            <Bell size={22} />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none">
              10
            </span>
          </button>

          {/* Messages Icon */}
          <button className="relative p-1.5 text-slate-700 hover:text-slate-900 transition-colors focus:outline-none">
            <Mail size={22} />
            <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none">
              30
            </span>
          </button>

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 hover:border-slate-400 text-sm font-medium transition-colors focus:outline-none"
            >
              <Sun size={16} className="text-slate-500" />
              <span>{theme}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={() => { setTheme('Light'); setIsThemeOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Light
                </button>
                <button
                  onClick={() => { setTheme('Dark'); setIsThemeOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Dark
                </button>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-300 shrink-0">
            <img
              src="https://i.pinimg.com/736x/07/fb/34/07fb3452c4640d881a16d08c2e314f3e.jpg"
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:inline-block text-sm font-bold text-slate-800 whitespace-nowrap">
              {user?.name || title}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 rounded-md text-sm font-medium transition-colors focus:outline-none"
          >
            Logout
          </button>

        </div>
      </div>
    </header>
  );
}
