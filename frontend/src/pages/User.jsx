import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { can } from "../utils/permissions";
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  SelectInput,
  TextInput,
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Doctor", label: "Doctor" },
  { value: "Receptionist", label: "Receptionist" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "Doctor",
  status: "active",
  password: "",
};

function UsersPageStyles() {
  return (
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-up { animation: fadeInUp 0.4s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-fade-up { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}

export default function User() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedRole, setSelectedRole] = useState("All");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const canCreate = can(user, "users", "create");
  const canUpdate = can(user, "users", "update");
  const canDelete = can(user, "users", "delete");

  const loadUsers = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");
      const response = await userService.getAll({
        search: searchTerm || undefined,
        role: selectedRole === "All" ? undefined : selectedRole,
        page: nextPage,
      });
      const paginator = response?.data || response || {};
      const rows = Array.isArray(paginator.data) ? paginator.data : [];
      setUsers(rows);
      setMeta({
        currentPage: paginator.current_page || 1,
        lastPage: paginator.last_page || 1,
        total: paginator.total || rows.length,
      });
      setPage(paginator.current_page || nextPage);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
      setError("We couldn't load users right now.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole, page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [loadUsers]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setFormError("");
    setFieldErrors({});
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      role: item.role?.name || "Doctor",
      status: item.status || "active",
      password: "",
    });
    setError("");
    setFormError("");
    setFieldErrors({});
    setFormView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
    setSubmitting(false);
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = t("users.formErrorName");
    if (!form.email.trim()) next.email = t("users.formErrorEmail");
    if (!formView || formView === "add") {
      if (!form.password.trim() || form.password.length < 8)
        next.password = t("users.formErrorPassword");
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) {
      setFormError(t("users.formErrorGeneral"));
      return;
    }
    setSubmitting(true);
    setError("");
    setFormError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        status: form.status,
      };

      if (!editingId || form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        await userService.update(editingId, payload);
        setToast(t("users.updatedSuccess"));
      } else {
        await userService.create(payload);
        setToast(t("users.createdSuccess"));
      }

      closeForm();
      if (editingId) await loadUsers(page);
      else await loadUsers(1);
    } catch (err) {
      console.error("Failed to save user:", err);
      const resErrors = err.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.entries(resErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(mapped);
        setFormError(Object.values(mapped)[0] || t("users.formErrorGeneral"));
      } else {
        setFormError(err.response?.data?.message || t("users.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await userService.delete(deleteTarget.id);
      setShowDelete(false);
      setToast(t("users.deletedSuccess"));
      await loadUsers(page);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const visibleUsers = useMemo(() => users, [users]);

  const handleFormField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formError) setFormError("");
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role?.name === "Admin").length;

  const statCards = [
    {
      icon: ShieldCheck,
      label: t("users.total"),
      value: meta.total,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      icon: CheckCircle2,
      label: t("users.active"),
      value: activeCount,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      icon: UserCog,
      label: t("users.admins"),
      value: adminCount,
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
  ];

  const userForm = (
    <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("users.accountInfo")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("users.name")} required error={fieldErrors.name}>
            <TextInput
              type="text"
              autoFocus
              value={form.name}
              onChange={handleFormField("name")}
              placeholder={t("users.namePlaceholder")}
            />
          </Field>
          <Field label={t("users.email")} required error={fieldErrors.email}>
            <TextInput
              type="email"
              value={form.email}
              onChange={handleFormField("email")}
              placeholder="user@clinic.com"
            />
          </Field>
          <Field label={t("users.phone")}>
            <TextInput
              type="text"
              value={form.phone}
              onChange={handleFormField("phone")}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label={t("users.role")} required>
            <SelectInput value={form.role} onChange={handleFormField("role")}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("users.access")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("users.status")} required>
            <SelectInput value={form.status} onChange={handleFormField("status")}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={editingId ? t("users.newPassword") : t("users.password")} required={!editingId} error={fieldErrors.password}>
            <TextInput
              type="password"
              value={form.password}
              onChange={handleFormField("password")}
              placeholder={editingId ? t("users.passwordKeep") : t("users.passwordMin")}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {editingId ? t("users.updateButton") : t("users.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
      <UsersPageStyles />

      {toast && (
        <div className="animate-fade-up fixed right-6 top-24 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-slate-200 dark:shadow-slate-950/60">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          {toast}
        </div>
      )}

      {formView ? (
        <>
          <button
            type="button"
            onClick={closeForm}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} />
            {t("users.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : UserCog}
            title={formView === "edit" ? t("users.editTitle") : t("users.addTitle")}
            subtitle={formView === "edit" ? t("users.editSubtitle") : t("users.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="user-form" loading={submitting}>
                  {editingId ? t("users.updateButton") : t("users.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {userForm}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={ShieldCheck}
            title={t("users.title")}
            subtitle={t("users.subtitle")}
            actions={
              canCreate && (
                <Button onClick={openAdd} className="transition-transform duration-150 active:scale-95">
                  <Plus size={18} />
                  {t("users.addButton")}
                </Button>
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map(({ icon: Icon, label, value, iconClass }, index) => (
              <div key={label} className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
                <Card padded className="flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t("users.searchPlaceholder")}
                className="w-full sm:max-w-sm"
              />
              <SelectInput
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-56"
              >
                <option value="All">{t("users.allRoles")}</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              {meta.total.toLocaleString()} {t("users.totalRecord")}
            </div>
          </Card>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-5 py-3 text-left">{t("users.colName")}</th>
                    <th className="px-5 py-3 text-left">{t("users.colEmail")}</th>
                    <th className="px-5 py-3 text-left">{t("users.colRole")}</th>
                    <th className="px-5 py-3 text-left">{t("users.colPhone")}</th>
                    <th className="px-5 py-3 text-left">{t("users.colStatus")}</th>
                    <th className="px-5 py-3 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-5 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : visibleUsers.length > 0 ? (
                    visibleUsers.map((item, index) => (
                      <tr
                        key={item.id}
                        className="animate-fade-up transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.email}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {item.role?.name || "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {item.phone || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusTone(item.status)} label={item.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(item)}
                                className="text-blue-600 hover:bg-blue-50! dark:text-blue-400 dark:hover:bg-blue-950/40!"
                              >
                                <Pencil size={14} />
                                {t("common.edit")}
                              </Button>
                            )}
                            {canDelete && item.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget(item);
                                  setShowDelete(true);
                                }}
                                className="text-red-600 hover:bg-red-50! dark:text-red-400 dark:hover:bg-red-950/30!"
                              >
                                <Trash2 size={14} />
                                {t("common.delete")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-5 py-16">
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <div className="rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <UserCog size={22} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-600 dark:text-slate-300">{t("users.emptyTitle")}</p>
                            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                              {t("users.emptyText")}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && meta.total > 0 && (
              <Pagination
                page={page}
                totalPages={meta.lastPage}
                onPageChange={(p) => loadUsers(p)}
                from={(page - 1) * 10 + 1}
                to={Math.min(page * 10, meta.total)}
                total={meta.total}
                label="users"
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("users.deleteTitle")}
        subtitle={deleteTarget ? `${deleteTarget.name} ${t("users.deleteSubtitle")}` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("users.deleteConfirm")}
          </p>
        </div>
      </Modal>
    </div>
  );
}