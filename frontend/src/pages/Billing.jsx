import { useEffect, useMemo, useState, useCallback } from "react";
import { Check, Clock, CreditCard, DollarSign, Receipt, Trash2, Wallet, X } from "lucide-react";
import paymentService from "../services/paymentService";
import { getPatients } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
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
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useUrlSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const pageSize = 8;

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreate = can(user, "payments", "create");
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
      setError("We couldn't load payments. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch sets loading state
    loadPayments();
  }, [loadPayments]);

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

  const confirmDelete = (payment) => {
    setPendingDelete(payment);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await paymentService.delete(pendingDelete.id);
      setShowDelete(false);
      await loadPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      setError("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = async () => {
    setForm(emptyForm);
    setFormError("");
    setShowAddModal(true);
    try {
      setLoadingLookups(true);
      const [patientsRes, appointmentsRes] = await Promise.all([
        getPatients({ per_page: 200 }),
        getAppointments({ per_page: 200 }),
      ]);
      setPatients(unwrapPaginator(patientsRes).items);
      setAppointments(unwrapPaginator(appointmentsRes).items);
    } catch (err) {
      console.error("Failed to load billing options:", err);
      setFormError("Couldn't load patients and appointments. Try again.");
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleFormChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedPatientAppointments = useMemo(() => {
    if (!form.patient_id) return [];
    return appointments.filter((a) => String(a.patient_id) === String(form.patient_id));
  }, [appointments, form.patient_id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id) {
      setFormError("Select a patient.");
      return;
    }
    if (!form.appointment_id) {
      setFormError("Select an appointment.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Enter a valid amount greater than 0.");
      return;
    }
    try {
      setSaving(true);
      setFormError("");
      await paymentService.create({
        patient_id: Number(form.patient_id),
        appointment_id: Number(form.appointment_id),
        amount: Number(form.amount),
        payment_method: form.payment_method,
        payment_status: form.payment_status,
        payment_date: form.payment_date,
        notes: form.notes || null,
      });
      setShowAddModal(false);
      await loadPayments();
    } catch (err) {
      console.log("Backend Validation Error Response:", err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        "Couldn't save the payment. Check the details and try again.";
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        title="Billing"
        subtitle="Track and manage patient payments."
        actions={
          canCreate && (
            <Button onClick={openAddModal}>
              <DollarSign size={18} />
              Add Payment
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total collected" value={currency(stats.totalCollected)} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" icon={DollarSign} />
        <StatCard label="Paid" value={stats.paidCount} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" icon={Check} />
        <StatCard label="Pending" value={stats.pendingCount} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" icon={Clock} />
        <StatCard label="Cancelled" value={stats.cancelledCount} tone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" icon={X} />
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
          placeholder="Search by patient or appointment #"
          className="md:max-w-md"
        />
        <SelectInput
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full md:w-44"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </SelectInput>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="p-3.5 text-left">Patient</th>
                <th className="p-3.5 text-left">Appointment</th>
                <th className="p-3.5 text-left">Amount</th>
                <th className="p-3.5 text-left">Method</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-left">Date</th>
                <th className="p-3.5 text-right">Action</th>
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
                            alt="Patient"
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
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(payment)}
                          className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                        >
                          <Trash2 size={15} />
                          Delete
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Read only</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Receipt size={26} strokeWidth={1.5} />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No payments found</p>
                      <p className="text-xs text-slate-400">
                        {search || status
                          ? "Try a different search or filter."
                          : "Payments will appear here once recorded."}
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

      <Modal
        open={showAddModal}
        onClose={() => !saving && setShowAddModal(false)}
        icon={Receipt}
        title="Add Payment"
        subtitle="Record a payment for a patient appointment."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving || loadingLookups} type="submit" form="payment-form">
              Save Payment
            </Button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="field-error rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          )}

          <Field label="Patient">
            <SelectInput
              required
              value={form.patient_id}
              onChange={handleFormChange("patient_id")}
              disabled={loadingLookups}
            >
              <option value="">
                {loadingLookups ? "Loading patients..." : "Select patient"}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.first_name || ""} ${p.last_name || ""}`.trim() || `Patient #${p.id}`} ({p.patient_code})
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Appointment">
            <SelectInput
              required
              value={form.appointment_id}
              onChange={handleFormChange("appointment_id")}
              disabled={loadingLookups}
            >
              <option value="">
                {!form.patient_id
                  ? "Select a patient first"
                  : loadingLookups
                  ? "Loading appointments..."
                  : "Select appointment"}
              </option>
              {selectedPatientAppointments.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {formatDate(a.appointment_date)} {a.appointment_time}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
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
            <Field label="Date">
              <TextInput type="date" required value={form.payment_date} onChange={handleFormChange("payment_date")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Method">
              <SelectInput value={form.payment_method} onChange={handleFormChange("payment_method")}>
                <option value="cash">Cash</option>
                <option value="aba">ABA</option>
                <option value="card">Card</option>
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={form.payment_status} onChange={handleFormChange("payment_status")}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </SelectInput>
            </Field>
          </div>

          <Field label="Notes">
            <TextArea rows={2} value={form.notes} onChange={handleFormChange("notes")} placeholder="Optional notes" />
          </Field>
        </form>
      </Modal>

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title="Delete this payment?"
        subtitle={
          pendingDelete
            ? `The ${currency(pendingDelete.amount)} payment for ${
                pendingDelete.patient?.first_name
              } ${pendingDelete.patient?.last_name} will be permanently removed. This can't be undone.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete Payment
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;