import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import paymentService from "../services/paymentService";
import { getPatients } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
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

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const initials = (first = "", last = "") => `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  patient_id: "",
  appointment_id: "",
  amount: "",
  payment_method: "cash",
  payment_status: "pending",
  payment_date: todayISO(),
  notes: "",
};

const MethodBadge = ({ method }) => {
  const key = (method || "").toLowerCase();
  const IconEl = key === "cash" ? Wallet : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <IconEl size={14} className="text-slate-400" />
      <span className="capitalize">{method || "—"}</span>
    </span>
  );
};

const StatCard = ({ label, value, tone, icon: IconEl }) => (
  <Card padded className="flex items-center gap-3">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <IconEl size={18} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </Card>
);

const Billing = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useUrlSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const pageSize = 8;

  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreate = can(user, "payments", "create");
  const canUpdate = can(user, "payments", "update");
  const canDelete = can(user, "payments", "delete");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await paymentService.getAll({
        page,
        per_page: pageSize,
        payment_status: status || undefined,
        search: search || undefined,
      });
      const { items, meta } = unwrapPaginator(response);
      setPayments(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(t("billing.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, status, search, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch sets loading state
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const filterKey = `${search}|${status}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.payment_status?.toLowerCase() === "paid");
    const pending = payments.filter((p) => p.payment_status?.toLowerCase() === "pending");
    const cancelled = payments.filter((p) => p.payment_status?.toLowerCase() === "cancelled");
    const totalCollected = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      totalCollected,
      paidCount: paid.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
    };
  }, [payments]);

  const loadLookups = useCallback(async () => {
    try {
      setLoadingLookups(true);
      setFormError("");
      const [patientsRes, appointmentsRes] = await Promise.all([
        getPatients({ per_page: 200 }),
        getAppointments({ per_page: 200 }),
      ]);
      setPatients(unwrapPaginator(patientsRes).items);
      setAppointments(unwrapPaginator(appointmentsRes).items);
    } catch (err) {
      console.error("Failed to load billing options:", err);
      setFormError(t("billing.lookupsError"));
    } finally {
      setLoadingLookups(false);
    }
  }, [t]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void loadLookups();
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      patient_id: record.patient_id ?? "",
      appointment_id: record.appointment_id ?? "",
      amount: record.amount ?? "",
      payment_method: (record.payment_method || "cash").toLowerCase(),
      payment_status: (record.payment_status || "pending").toLowerCase(),
      payment_date: record.payment_date ? record.payment_date.slice(0, 10) : todayISO(),
      notes: record.notes || "",
    });
    setFormError("");
    setFormView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void loadLookups();
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setSubmitting(false);
  };

  const handleFormChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (formError) setFormError("");
  };

  const selectedPatientAppointments = useMemo(() => {
    if (!form.patient_id) return [];
    return appointments.filter((a) => String(a.patient_id) === String(form.patient_id));
  }, [appointments, form.patient_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.patient_id) {
      setFormError(t("billing.formErrorPatient"));
      return;
    }
    if (!form.appointment_id) {
      setFormError(t("billing.formErrorAppointment"));
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError(t("billing.formErrorAmount"));
      return;
    }
    const payload = {
      patient_id: Number(form.patient_id),
      appointment_id: Number(form.appointment_id),
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      payment_date: form.payment_date,
      notes: form.notes || null,
    };
    setSubmitting(true);
    setFormError("");
    try {
      if (editingId) {
        const res = await paymentService.update(editingId, payload);
        const updated = res?.data ?? res;
        setPayments((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
        setToast(t("billing.updatedSuccess"));
      } else {
        const res = await paymentService.create(payload);
        const created = res?.data ?? res;
        setPayments((prev) => [created, ...prev]);
        setPage(1);
        setToast(t("billing.createdSuccess"));
      }
      closeForm();
    } catch (err) {
      console.log("Backend Validation Error Response:", err.response?.data);
      const errorMessage =
        err.response?.data?.message || t("billing.saveError");
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (payment) => {
    setDeleteTarget(payment);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await paymentService.delete(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("billing.deletedSuccess"));
      await loadPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      setError(t("billing.deleteServerError"));
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const billingForm = (
    <form id="billing-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <DollarSign size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("billing.sectionPayment")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("billing.fieldPatient")} required>
            <SelectInput
              required
              value={form.patient_id}
              onChange={handleFormChange("patient_id")}
              disabled={loadingLookups}
            >
              <option value="">
                {loadingLookups ? t("billing.loadingPatients") : t("billing.selectPatient")}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.first_name || ""} ${p.last_name || ""}`.trim() || `${t("billing.patientIdLabel")}${p.id}`} ({p.patient_code})
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("billing.fieldAppointment")} required>
            <SelectInput
              required
              value={form.appointment_id}
              onChange={handleFormChange("appointment_id")}
              disabled={loadingLookups}
            >
              <option value="">
                {!form.patient_id
                  ? t("billing.selectPatientFirst")
                  : loadingLookups
                  ? t("billing.loadingAppointments")
                  : t("billing.selectAppointment")}
              </option>
              {selectedPatientAppointments.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {formatDate(a.appointment_date)} {a.appointment_time}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("billing.sectionAmount")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("billing.fieldAmount")} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <TextInput
                type="number"
                step="0.01"
                min="0"
                required
                value={form.amount}
                onChange={handleFormChange("amount")}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </Field>
          <Field label={t("billing.fieldDate")} required>
            <TextInput type="date" required value={form.payment_date} onChange={handleFormChange("payment_date")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("billing.fieldMethod")} required>
            <SelectInput value={form.payment_method} onChange={handleFormChange("payment_method")}>
              <option value="cash">{t("billing.methodCash")}</option>
              <option value="aba">{t("billing.methodAba")}</option>
              <option value="card">{t("billing.methodCard")}</option>
            </SelectInput>
          </Field>
          <Field label={t("billing.fieldStatus")} required>
            <SelectInput value={form.payment_status} onChange={handleFormChange("payment_status")}>
              <option value="pending">{t("billing.statusPending")}</option>
              <option value="paid">{t("billing.statusPaid")}</option>
              <option value="cancelled">{t("billing.statusCancelled")}</option>
            </SelectInput>
          </Field>
        </div>

        <Field label={t("billing.fieldNotes")}>
          <TextArea rows={2} value={form.notes} onChange={handleFormChange("notes")} placeholder={t("billing.notesPlaceholder")} />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {editingId ? t("billing.updateButton") : t("billing.saveButton")}
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
            {t("billing.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : Receipt}
            title={formView === "edit" ? t("billing.editTitle") : t("billing.addTitle")}
            subtitle={formView === "edit" ? t("billing.editSubtitle") : t("billing.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="billing-form" loading={submitting}>
                  {editingId ? t("billing.updateButton") : t("billing.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {billingForm}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={Receipt}
            title={t("billing.title")}
            subtitle={t("billing.subtitle")}
            actions={
              canCreate && (
                <Button onClick={openAdd} className="transition-transform duration-150 active:scale-95">
                  <Plus size={18} />
                  {t("billing.addButton")}
                </Button>
              )
            }
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label={t("billing.totalCollected")} value={currency(stats.totalCollected)} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" icon={DollarSign} />
            <StatCard label={t("billing.paid")} value={stats.paidCount} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" icon={Check} />
            <StatCard label={t("billing.pending")} value={stats.pendingCount} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" icon={Clock} />
            <StatCard label={t("billing.cancelled")} value={stats.cancelledCount} tone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" icon={X} />
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                &times;
              </button>
            </div>
          )}

          <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("billing.searchPlaceholder")}
              className="md:max-w-md"
            />
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full md:w-44"
            >
              <option value="">{t("billing.allStatuses")}</option>
              <option value="pending">{t("billing.statusPending")}</option>
              <option value="paid">{t("billing.statusPaid")}</option>
              <option value="cancelled">{t("billing.statusCancelled")}</option>
            </SelectInput>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="p-3.5 text-left">{t("billing.colPatient")}</th>
                    <th className="p-3.5 text-left">{t("billing.colAppointment")}</th>
                    <th className="p-3.5 text-left">{t("billing.colAmount")}</th>
                    <th className="p-3.5 text-left">{t("billing.colMethod")}</th>
                    <th className="p-3.5 text-left">{t("billing.colStatus")}</th>
                    <th className="p-3.5 text-left">{t("billing.colDate")}</th>
                    <th className="p-3.5 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="p-3.5">
                            <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: j === 0 ? "70%" : "50%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {payment.patient?.avatar_url ? (
                              <img
                                src={payment.patient.avatar_url}
                                alt={t("billing.fieldPatient")}
                                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                {initials(payment.patient?.first_name, payment.patient?.last_name)}
                              </div>
                            )}
                            <span className="font-medium text-slate-900 dark:text-white">
                              {payment.patient?.first_name} {payment.patient?.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            #{payment.appointment_id}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          {currency(payment.amount)}
                        </td>
                        <td className="p-3.5">
                          <MethodBadge method={payment.payment_method} />
                        </td>
                        <td className="p-3.5">
                          <Badge tone={statusTone(payment.payment_status)} label={payment.payment_status} />
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="p-3.5 text-right">
                          {canUpdate || canDelete ? (
                            <div className="inline-flex items-center gap-1.5">
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(payment)}
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
                                  onClick={() => confirmDelete(payment)}
                                  className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                                >
                                  <Trash2 size={15} />
                                  {t("common.delete")}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{t("common.viewOnly")}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-16">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Receipt size={26} strokeWidth={1.5} />
                          <p className="font-medium text-slate-600 dark:text-slate-300">{t("billing.emptyTitle")}</p>
                          <p className="text-xs text-slate-400">
                            {search || status
                              ? t("billing.emptySearchText")
                              : t("billing.emptyText")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && payments.length > 0 && (
              <Pagination
                page={meta.currentPage}
                totalPages={meta.lastPage}
                onPageChange={setPage}
                from={meta.from}
                to={meta.to}
                total={meta.total}
                label="payments"
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("billing.deleteTitle")}
        subtitle={
          deleteTarget
            ? `${deleteTarget.patient?.first_name} ${deleteTarget.patient?.last_name} ${t("billing.deleteSubtitle")}`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("billing.deleteConfirm")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("billing.deleteWarning")}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;