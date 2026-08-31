import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Building,
  CheckCircle2,
  Inbox,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";
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
  TextArea,
  TextInput,
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const emptyForm = { name: "", description: "", status: "active" };
const ITEMS_PER_PAGE = 8;

const StatCard = ({ label, value, icon: Icon, tone, delay }) => (
  <div className="animate-fade-up" style={{ animationDelay: delay }}>
    <Card
      padded
      className="flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
  </div>
);

export default function Departments() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formView, setFormView] = useState(null);
  const [toast, setToast] = useState("");

  const [searchQuery, setSearchQuery] = useUrlSearch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const canCreate = can(user, "departments", "create");
  const canUpdate = can(user, "departments", "update");
  const canDelete = can(user, "departments", "delete");

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page: currentPage, per_page: ITEMS_PER_PAGE };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await getDepartments(params);
      const { items, meta } = unwrapPaginator(response);
      setDepartments(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load departments", err);
      setError(t("departments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDepartments();
    }, 120);
    return () => clearTimeout(timer);
  }, [loadDepartments]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const filterKey = `${searchQuery}|${statusFilter}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setCurrentPage(1);
  }

  const activeCount = useMemo(
    () => departments.filter((d) => (d.status || "active") === "active").length,
    [departments]
  );

  const handleOpenAdd = () => {
    setFormError("");
    setFieldErrors({});
    setForm(emptyForm);
    setEditingId(null);
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (dept) => {
    setFormError("");
    setFieldErrors({});
    setEditingId(dept.id);
    setForm({
      name: dept.name || "",
      description: dept.description || "",
      status: dept.status || "active",
    });
    setFormView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
    setSaving(false);
  };

  const handleField = (field) => (e) => {
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

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFormError("");

    if (!form.name.trim()) {
      setFieldErrors({ name: t("departments.errorName") });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateDepartment(editingId, form);
        setToast(t("departments.updatedSuccess"));
      } else {
        await createDepartment(form);
        setToast(t("departments.createdSuccess"));
        setCurrentPage(1);
      }

      closeForm();
      await loadDepartments();
    } catch (err) {
      if (err.response?.status === 404) {
        closeForm();
        setError(t("departments.notFound"));
        await loadDepartments();
        return;
      }
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const firstErrorMsg = Object.values(validationErrors)[0][0];
        setFormError(firstErrorMsg);
      } else {
        setFormError(err.response?.data?.message || t("departments.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dept) => {
    setPendingDelete(dept);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const targetId = pendingDelete.id;
    if (!targetId) return;

    try {
      setDeleting(true);
      await deleteDepartment(targetId);
      setShowDelete(false);
      setPendingDelete(null);
      setToast(t("departments.deletedSuccess"));
      if (editingId === targetId) closeForm();
      if (departments.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await loadDepartments();
      }
    } catch (err) {
      setError(err.response?.data?.message || t("departments.deleteError"));
      setShowDelete(false);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const departmentForm = (
    <form id="department-form" onSubmit={save} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <Building2 size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("departments.details")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("departments.name")} required error={fieldErrors.name}>
            <TextInput
              autoFocus
              placeholder="e.g. Cardiology"
              value={form.name}
              onChange={handleField("name")}
            />
          </Field>

          <Field label={t("departments.status")} required>
            <SelectInput value={form.status} onChange={handleField("status")}>
              <option value="active">{t("departments.statusActive")}</option>
              <option value="inactive">{t("departments.statusInactive")}</option>
            </SelectInput>
          </Field>
        </div>

        <Field label={t("departments.description")} hint={t("departments.descriptionHint")}>
          <TextArea
            rows={4}
            placeholder={t("departments.descriptionPlaceholder")}
            value={form.description}
            onChange={handleField("description")}
          />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={saving}>
          {editingId ? t("departments.updateButton") : t("departments.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeInUp .4s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up { animation: none !important; }
        }
      `}</style>

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
            {t("departments.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : Building2}
            title={formView === "edit" ? t("departments.editTitle") : t("departments.addTitle")}
            subtitle={formView === "edit" ? t("departments.editSubtitle") : t("departments.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={saving}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="department-form" loading={saving}>
                  {editingId ? t("departments.updateButton") : t("departments.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {departmentForm}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={Building2}
            title={t("departments.title")}
            subtitle={
              canCreate
                ? t("departments.subtitleManage")
                : t("departments.subtitleView")
            }
            actions={
              canCreate && (
                <Button
                  onClick={handleOpenAdd}
                  className="transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus size={18} />
                  {t("departments.addButton")}
                </Button>
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              delay="0ms"
              label={t("departments.total")}
              value={meta.total}
              icon={Building2}
              tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
            />
            <StatCard
              delay="60ms"
              label={t("departments.active")}
              value={activeCount}
              icon={Building}
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            />
            <StatCard
              delay="120ms"
              label={t("departments.inactive")}
              value={departments.length - activeCount}
              icon={Building2}
              tone="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                &times;
              </button>
            </div>
          )}

          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={searchQuery}
                onChange={(v) => setSearchQuery(v)}
                placeholder={t("departments.searchPlaceholder")}
                className="w-full sm:max-w-xs"
              />
              <SelectInput
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44"
              >
                <option value="all">{t("departments.allStatuses")}</option>
                <option value="active">{t("departments.statusActive")}</option>
                <option value="inactive">{t("departments.statusInactive")}</option>
              </SelectInput>
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              title="Reset filters"
              className="transition-transform duration-150 active:scale-90"
            >
              <SlidersHorizontal size={16} />
              {t("departments.reset")}
            </Button>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-6 py-3.5">{t("departments.colName")}</th>
                    <th className="px-6 py-3.5">{t("departments.colDescription")}</th>
                    <th className="px-6 py-3.5">{t("departments.colStatus")}</th>
                    <th className="px-6 py-3.5 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: j === 1 ? "60%" : "40%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <Inbox size={20} />
                          </div>
                          <p className="font-medium text-slate-500 dark:text-slate-300">
                            {searchQuery || statusFilter !== "all"
                              ? t("departments.emptySearchTitle")
                              : t("departments.emptyTitle")}
                          </p>
                          <p className="text-xs text-slate-400">
                            {searchQuery || statusFilter !== "all"
                              ? t("departments.emptySearchText")
                              : t("departments.emptyText")}
                          </p>
                          {!searchQuery && statusFilter === "all" && canCreate && (
                            <Button variant="secondary" className="mt-3" onClick={handleOpenAdd}>
                              <Plus size={16} />
                              {t("departments.createFirst")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept, i) => (
                      <tr
                        key={dept.id}
                        className="animate-fade-up transition-colors duration-150 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
                              <Building2 size={16} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{dept.name}</span>
                          </div>
                        </td>
                        <td className="max-w-md truncate px-6 py-4 text-slate-500 dark:text-slate-400">
                          {dept.description || (
                            <span className="italic text-slate-300 dark:text-slate-600">{t("departments.noDescription")}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={statusTone(dept.status)} label={dept.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(dept)}
                                title="Edit"
                                className="text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-950/40"
                              >
                                <Pencil size={15} />
                                {t("common.edit")}
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(dept)}
                                title="Delete"
                                className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                              >
                                <Trash2 size={15} />
                                {t("common.delete")}
                              </Button>
                            )}
                            {!canUpdate && !canDelete && (
                              <span className="text-xs text-slate-400">{t("common.viewOnly")}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && departments.length > 0 && (
              <Pagination
                page={meta.currentPage}
                totalPages={meta.lastPage}
                onPageChange={setCurrentPage}
                from={meta.from}
                to={meta.to}
                total={meta.total}
                label="departments"
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("departments.deleteTitle")}
        subtitle={
          pendingDelete ? `${pendingDelete.name} ${t("departments.deleteSubtitle")}` : ""
        }
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
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("departments.deleteConfirm")}</p>
        </div>
      </Modal>
    </div>
  );
}