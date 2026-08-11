import { useState } from "react";
import { KeyRound, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { changePassword } = useAuth();
  const themeState = useTheme();
  const theme = themeState?.theme || "light";
  const toggleTheme = themeState?.toggleTheme || (() => {});
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await changePassword(form);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Password could not be changed.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500">Theme and account security.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Dark mode</p>
              <p className="text-sm text-slate-500">Change the system appearance.</p>
            </div>
          </div>
          <button type="button" onClick={toggleTheme} className={`h-6 w-11 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-blue-600" : "bg-slate-300"}`}>
            <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <KeyRound size={20} className="text-blue-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">Change password</h2>
        </div>
        <div className="grid gap-4">
          {[
            ["current_password", "Current password"],
            ["password", "New password"],
            ["password_confirmation", "Confirm new password"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {label}
              <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Update password
        </button>
      </form>
    </div>
  );
}
