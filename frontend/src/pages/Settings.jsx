import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, KeyRound, Moon, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500";

const LABEL_CLASS =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

function PasswordField({ label, value, onChange, placeholder }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={`${INPUT_CLASS} pr-10`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("settings.hidePassword") : t("settings.showPassword")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 active:scale-90 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, changePassword, deleteAccount } = useAuth();
  const { t, localizedPath } = useLocale();
  const themeState = useTheme();
  const theme = themeState?.theme || "light";
  const toggleTheme = themeState?.toggleTheme || (() => {});
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [deleteForm, setDeleteForm] = useState({ password: "", confirmation_email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await changePassword(form);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      setMessage(t("settings.passwordSuccess"));
    } catch (err) {
      setError(err.response?.data?.message || t("settings.passwordError"));
    }
  };

  const submitDelete = (event) => {
    event.preventDefault();
    setDeleteMessage("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      const result = await deleteAccount(deleteForm);
      setShowDeleteConfirm(false);
      setDeleteMessage(result.message || t("settings.deleteSuccess"));
      window.setTimeout(() => {
        window.location.href = localizedPath("/login");
      }, 900);
    } catch (err) {
      setShowDeleteConfirm(false);
      setDeleteError(err.response?.data?.message || t("settings.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete =
    deleteForm.confirmation_email.toLowerCase() === (user?.email || "").toLowerCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("settings.title")}</h1>
        <p className="text-sm text-slate-500">{t("settings.subtitle")}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t("settings.darkMode")}</p>
              <p className="text-sm text-slate-500">{t("settings.darkModeHelp")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-6 w-11 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <KeyRound size={20} className="text-blue-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">{t("settings.changePassword")}</h2>
        </div>
        <div className="grid gap-4">
          <PasswordField
            label={t("settings.currentPassword")}
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          />
          <PasswordField
            label={t("settings.newPassword")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <PasswordField
            label={t("settings.confirmPassword")}
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </div>
        {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="mt-6">{t("settings.updatePassword")}</Button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 text-blue-600" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{t("settings.signInSecurity")}</h2>
            <p className="text-sm text-slate-500">{t("settings.signInSecurityHelp")}</p>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
          <p>{t("settings.securityEmail", { email: user?.email || "" })}</p>
          <p>{t("settings.securityOtp")}</p>
          <p>{t("settings.securityGoogle")}</p>
        </div>
      </div>

      <form onSubmit={submitDelete} className="rounded-lg border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/60 dark:bg-slate-900">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 text-red-600" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{t("settings.deleteAccount")}</h2>
            <p className="text-sm text-slate-500">{t("settings.deleteHelp")}</p>
          </div>
        </div>
        <div className="grid gap-4">
          <div>
            <label htmlFor="delete-confirm-email" className={LABEL_CLASS}>{t("settings.confirmEmail")}</label>
            <input
              id="delete-confirm-email"
              type="email"
              autoComplete="off"
              className={INPUT_CLASS}
              value={deleteForm.confirmation_email}
              onChange={(e) => setDeleteForm({ ...deleteForm, confirmation_email: e.target.value })}
              placeholder="name@example.com"
            />
          </div>
          <PasswordField
            label={t("settings.deletePassword")}
            value={deleteForm.password}
            onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
            placeholder={t("settings.deletePasswordPlaceholder")}
          />
        </div>
        {deleteMessage && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{deleteMessage}</p>}
        {deleteError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
        <Button type="submit" variant="danger" disabled={!canDelete || isDeleting} className="mt-6">
          <Trash2 size={16} />
          {t("settings.deleteButton")}
        </Button>
      </form>

      <Modal
        open={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        size="sm"
        title={t("settings.deleteConfirmTitle")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              {t("settings.deleteConfirmCancel")}
            </Button>
            <Button variant="danger" onClick={performDelete} loading={isDeleting}>
              <Trash2 size={16} />
              {t("settings.deleteConfirmAccept")}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t("settings.deleteConfirmBody")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
