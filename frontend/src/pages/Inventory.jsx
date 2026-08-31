import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Package,
  PackageX,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import medicineService from "../services/medicineService";
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
  TextArea,
  TextInput,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

const formatDate = (d) => {
  if (!d) return "N/A";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();
const isLowStock = (quantity) => Number(quantity) <= 10;

const emptyForm = {
  name: "",
  category: "",
  description: "",
  quantity: "",
  unit: "",
  price: "",
  expiry_date: "",
};

const UNIT_OPTIONS = [
  "tablet",
  "capsule",
  "bottle",
  "vial",
  "tube",
  "strip",
  "box",
  "sachet",
  "ampoule",
  "injection",
];

const CATEGORY_OPTIONS = [
  "Analgesic",
  "Antibiotic",
  "Antihistamine",
  "Antipyretic",
  "Antiseptic",
  "Cardiovascular",
  "Dermatological",
  "Gastrointestinal",
  "Hormonal",
  "Respiratory",
  "Sedative",
  "Vitamin",
];

function InventoryPageStyles() {
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

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <Card padded className="flex items-center gap-3">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </Card>
);

const Inventory = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useUrlSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const pageSize = 8;

  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreate = can(user, "medicines", "create");
  const canUpdate = can(user, "medicines", "update");
  const canDelete = can(user, "medicines", "delete");

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await medicineService.getAll({
        page,
        per_page: pageSize,
        search: search || undefined,
      });
      const { items, meta: nextMeta } = unwrapPaginator(response);
      setMedicines(items);
      setMeta(nextMeta);
    } catch (err) {
      console.error("Failed to load medicines:", err);
      setError(t("inventory.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadMedicines();
    }, 300);
    return () => clearTimeout(handler);
  }, [loadMedicines]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(
    () => ({
      total: meta.total,
      lowStockCount: medicines.filter((m) => isLowStock(m.quantity)).length,
      expiredCount: medicines.filter((m) => isExpired(m.expiry_date)).length,
    }),
    [medicines, meta]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (medicine) => {
    setEditingId(medicine.id);
    setForm({
      name: medicine.name || "",
      category: medicine.category || "",
      description: medicine.description || "",
      quantity: medicine.quantity ?? "",
      unit: medicine.unit || "",
      price: medicine.price ?? "",
      expiry_date: medicine.expiry_date ? medicine.expiry_date.slice(0, 10) : "",
    });
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

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = t("inventory.errorName");
    if (!form.category.trim()) next.category = t("inventory.errorCategory");
    if (form.quantity === "" || Number(form.quantity) < 0) next.quantity = t("inventory.errorQuantity");
    if (form.price === "" || Number(form.price) < 0) next.price = t("inventory.errorPrice");
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) {
      setFormError(t("inventory.formErrorGeneral"));
      return;
    }
    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        price: Number(form.price),
        expiry_date: form.expiry_date || null,
      };

      if (editingId) {
        await medicineService.update(editingId, payload);
        setToast(t("inventory.updatedSuccess"));
        setMedicines((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...payload } : m))
        );
      } else {
        await medicineService.create(payload);
        setToast(t("inventory.createdSuccess"));
        setPage(1);
      }

      closeForm();
      await loadMedicines();
    } catch (err) {
      console.error("Failed to save medicine:", err);
      const resErrors = err.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.entries(resErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(mapped);
        setFormError(Object.values(mapped)[0] || t("inventory.formErrorGeneral"));
      } else {
        setFormError(err.response?.data?.message || t("inventory.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (medicine) => {
    setDeleteTarget(medicine);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await medicineService.delete(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("inventory.deletedSuccess"));
      if (medicines.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await loadMedicines();
      }
    } catch (err) {
      console.error("Failed to delete medicine:", err);
      setFormError(err.response?.data?.message || t("inventory.deleteServerError"));
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const medicineForm = (
    <form id="inventory-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("inventory.sectionDetails")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("inventory.fieldName")} required error={fieldErrors.name}>
            <TextInput
              type="text"
              autoFocus
              value={form.name}
              onChange={handleFormField("name")}
              placeholder={t("inventory.namePlaceholder")}
            />
          </Field>
          <Field label={t("inventory.fieldCategory")} required error={fieldErrors.category}>
            <TextInput
              type="text"
              value={form.category}
              onChange={handleFormField("category")}
              placeholder={t("inventory.categoryPlaceholder")}
              list="category-options"
            />
            <datalist id="category-options">
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label={t("inventory.fieldDescription")}>
          <TextArea
            rows={3}
            value={form.description}
            onChange={handleFormField("description")}
            placeholder={t("inventory.descriptionPlaceholder")}
          />
        </Field>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("inventory.sectionStock")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("inventory.fieldQuantity")} required error={fieldErrors.quantity}>
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={handleFormField("quantity")}
              placeholder="0"
            />
          </Field>
          <Field label={t("inventory.fieldUnit")}>
            <TextInput
              type="text"
              value={form.unit}
              onChange={handleFormField("unit")}
              placeholder={t("inventory.unitPlaceholder")}
              list="unit-options"
            />
            <datalist id="unit-options">
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>
          <Field label={t("inventory.fieldPrice")} required error={fieldErrors.price}>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleFormField("price")}
              placeholder="0.00"
            />
          </Field>
        </div>
        <Field label={t("inventory.fieldExpiryDate")}>
          <TextInput
            type="date"
            value={form.expiry_date}
            onChange={handleFormField("expiry_date")}
          />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {editingId ? t("inventory.updateButton") : t("inventory.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
      <InventoryPageStyles />

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
            {t("inventory.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : Pill}
            title={formView === "edit" ? t("inventory.editTitle") : t("inventory.addTitle")}
            subtitle={formView === "edit" ? t("inventory.editSubtitle") : t("inventory.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="inventory-form" loading={submitting}>
                  {editingId ? t("inventory.updateButton") : t("inventory.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {medicineForm}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={Boxes}
            title={t("inventory.title")}
            subtitle={t("inventory.subtitle")}
            actions={
              canCreate && (
                <Button onClick={openAdd} className="transition-transform duration-150 active:scale-95">
                  <Plus size={18} />
                  {t("inventory.addButton")}
                </Button>
              )
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={t("inventory.totalItems")} value={stats.total} icon={Package} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
            <StatCard label={t("inventory.lowStock")} value={stats.lowStockCount} icon={AlertTriangle} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
            <StatCard label={t("inventory.expired")} value={stats.expiredCount} icon={PackageX} tone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" />
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                &times;
              </button>
            </div>
          )}

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("inventory.searchPlaceholder")}
            className="max-w-md"
          />

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="p-3.5 text-left">{t("inventory.colName")}</th>
                    <th className="p-3.5 text-left">{t("inventory.colCategory")}</th>
                    <th className="p-3.5 text-left">{t("inventory.colQuantity")}</th>
                    <th className="p-3.5 text-left">{t("inventory.colPrice")}</th>
                    <th className="p-3.5 text-left">{t("inventory.colExpiry")}</th>
                    <th className="p-3.5 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="p-3.5">
                            <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: j === 0 ? "70%" : "50%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : medicines.length > 0 ? (
                    medicines.map((medicine) => {
                      const expired = isExpired(medicine.expiry_date);
                      const lowStock = isLowStock(medicine.quantity);
                      return (
                        <tr key={medicine.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <Pill size={15} />
                              </div>
                              {medicine.name}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {medicine.category || "—"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${lowStock ? "text-amber-600" : "text-slate-700 dark:text-slate-200"}`}>
                                {medicine.quantity}
                              </span>
                              {lowStock && (
                                <Badge tone="amber" label={t("inventory.lowStockBadge")} dot={false} />
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 dark:text-slate-200">{currency(medicine.price)}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className={expired ? "font-medium text-red-600" : "text-slate-600 dark:text-slate-300"}>
                                {formatDate(medicine.expiry_date)}
                              </span>
                              {expired && <Badge tone="red" label={t("inventory.expiredBadge")} dot={false} />}
                            </div>
                          </td>
                          <td className="whitespace-nowrap p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(medicine)}
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
                                  onClick={() => confirmDelete(medicine)}
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
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-16">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Search size={24} strokeWidth={1.5} />
                          <p className="font-medium text-slate-600 dark:text-slate-300">{t("inventory.emptyTitle")}</p>
                          <p className="text-xs text-slate-400">
                            {search ? t("inventory.emptySearchText") : t("inventory.emptyText")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && medicines.length > 0 && (
              <Pagination
                page={meta.currentPage}
                totalPages={meta.lastPage}
                onPageChange={setPage}
                from={meta.from}
                to={meta.to}
                total={meta.total}
                label="items"
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("inventory.deleteTitle")}
        subtitle={
          deleteTarget
            ? `${deleteTarget.name} ${t("inventory.deleteSubtitle")}`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("inventory.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("inventory.deleteWarning")}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
