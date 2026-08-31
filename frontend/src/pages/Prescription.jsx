import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Pill,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import prescriptionService from "../services/prescriptionService";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import medicineService from "../services/medicineService";
import medicalRecordService from "../services/medicalRecordService";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { can } from "../utils/permissions";
import {
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
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const formatDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const initials = (first = "", last = "") =>
  `${first.charAt(0) || ""}${last.charAt(0) || ""}`.toUpperCase() || "?";

const emptyItem = () => ({
  key: crypto.randomUUID(),
  medicine_id: "",
  quantity: "",
  dosage: "",
  frequency: "",
  duration: "",
  instruction: "",
});

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  patient_id: "",
  doctor_id: "",
  medical_record_id: "",
  prescription_date: todayISO(),
  notes: "",
};

const unwrapList = (res) => res.data?.data?.data || res.data?.data || res.data || [];

const Prescriptions = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useUrlSearch();
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([emptyItem()]);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const canCreate = can(user, "prescriptions", "create");
  const canUpdate = can(user, "prescriptions", "update");
  const canDelete = can(user, "prescriptions", "delete");

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, per_page: 8 };
      if (query) params.search = query;

      const response = await prescriptionService.getAll(params);
      const { items, meta } = unwrapPaginator(response);
      setPrescriptions(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setError(t("prescriptions.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPrescriptions();
    }, 120);
    return () => clearTimeout(timer);
  }, [query, page]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadLookups = async () => {
    try {
      setLoadingLookups(true);
      const [patientsRes, doctorsRes, medicinesRes] = await Promise.all([
        getPatients({ per_page: 200 }),
        getDoctors({ per_page: 200 }),
        medicineService.getAll({ per_page: 200 }),
      ]);
      setPatients(Array.isArray(unwrapList(patientsRes)) ? unwrapList(patientsRes) : []);
      setDoctors(Array.isArray(unwrapList(doctorsRes)) ? unwrapList(doctorsRes) : []);
      setMedicines(Array.isArray(unwrapList(medicinesRes)) ? unwrapList(medicinesRes) : []);
    } catch (err) {
      console.error("Failed to load form data:", err);
    } finally {
      setLoadingLookups(false);
    }
  };

  useEffect(() => {
    if (!form.patient_id) {
      setMedicalRecords([]);
      setForm((f) => (f.medical_record_id ? { ...f, medical_record_id: "" } : f));
      return;
    }
    let isMounted = true;

    const loadRecords = async () => {
      try {
        setLoadingRecords(true);
        const res = await medicalRecordService.getByPatient(form.patient_id);
        const data = res.data?.data?.data || res.data?.data || res.data || [];
        if (isMounted) setMedicalRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load medical records:", err);
        if (isMounted) setMedicalRecords([]);
      } finally {
        if (isMounted) setLoadingRecords(false);
      }
    };

    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [form.patient_id]);

  const medicineById = useMemo(
    () => Object.fromEntries(medicines.map((m) => [String(m.id), m])),
    [medicines]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, prescription_date: todayISO() });
    setItems([emptyItem()]);
    setFormError("");
    setFieldErrors({});
    setFormView("add");
    void loadLookups();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      patient_id: record.patient_id || record.patient?.id || "",
      doctor_id: record.doctor_id || record.doctor?.id || "",
      medical_record_id: record.medical_record_id || "",
      prescription_date: (record.prescription_date || todayISO()).slice(0, 10),
      notes: record.notes || "",
    });
    setItems(
      (record.items || []).length
        ? record.items.map((it) => ({
            key: crypto.randomUUID(),
            medicine_id: it.medicine_id || it.medicine?.id || "",
            quantity: it.quantity ?? "",
            dosage: it.dosage || "",
            frequency: it.frequency || "",
            duration: it.duration || "",
            instruction: it.instruction || "",
          }))
        : [emptyItem()]
    );
    setFormError("");
    setFieldErrors({});
    setFormView("edit");
    void loadLookups();
    setMedicalRecords([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setItems([emptyItem()]);
    setMedicalRecords([]);
    setFormError("");
    setFieldErrors({});
    setSubmitting(false);
  };

  const setField = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formError) setFormError("");
  };

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const validateForm = () => {
    const next = {};
    if (!form.patient_id) next.patient_id = t("prescriptions.selectPatient");
    if (!form.doctor_id) next.doctor_id = t("prescriptions.selectDoctor");
    if (!form.medical_record_id) next.medical_record_id = t("prescriptions.selectRecord");
    if (!form.prescription_date) next.prescription_date = t("prescriptions.pickDate");

    const itemErrors = items.map((it) => {
      const e = {};
      if (!it.medicine_id) e.medicine_id = t("prescriptions.required");
      if (!it.quantity || Number(it.quantity) <= 0) e.quantity = t("prescriptions.required");
      if (!it.dosage.trim()) e.dosage = t("prescriptions.required");
      if (!it.frequency.trim()) e.frequency = t("prescriptions.required");
      if (!it.duration.trim()) e.duration = t("prescriptions.required");
      return e;
    });
    if (itemErrors.some((e) => Object.keys(e).length > 0)) next.items = itemErrors;

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    patient_id: Number(form.patient_id),
    doctor_id: Number(form.doctor_id),
    medical_record_id: Number(form.medical_record_id),
    prescription_date: form.prescription_date,
    notes: form.notes.trim() || null,
    items: items.map((item) => ({
      medicine_id: Number(item.medicine_id),
      quantity: Number(item.quantity),
      dosage: item.dosage.trim(),
      frequency: item.frequency.trim(),
      duration: item.duration.trim(),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) {
      setFormError(t("prescriptions.saveCheckForm"));
      return;
    }
    setSubmitting(true);
    setFormError("");

    try {
      const payload = buildPayload();
      if (editingId) {
        const res = await prescriptionService.update(editingId, payload);
        const updated = res.data?.data || res.data || { ...payload, id: editingId };
        setPrescriptions((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
        );
        setToast(t("prescriptions.updatedSuccess"));
      } else {
        const res = await prescriptionService.create(payload);
        const created = res.data?.data || res.data || payload;
        setPrescriptions((prev) => [created, ...prev]);
        setToast(t("prescriptions.createdSuccess"));
        setPage(1);
      }

      closeForm();
      await fetchPrescriptions();
    } catch (err) {
      console.error("Failed to save prescription:", err);
      const resErrors = err.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.entries(resErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(mapped);
        setFormError(Object.values(mapped)[0] || t("prescriptions.saveCheckForm"));
      } else {
        setFormError(err.response?.data?.message || t("prescriptions.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (prescription) => {
    setDeleteTarget(prescription);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await prescriptionService.delete(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("prescriptions.deletedSuccess"));
      await fetchPrescriptions();
    } catch (err) {
      console.error("Failed to delete prescription:", err);
      setError(err.response?.data?.message || t("prescriptions.deleteServerError"));
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const patientName = (prescription) => {
    const p = prescription.patient;
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : t("prescriptions.unknownPatient");
  };

  const doctorName = (prescription) => {
    const d = prescription.doctor;
    return d ? `${d.first_name || ""} ${d.last_name || ""}`.trim() : "";
  };

  const prescriptionForm = (
    <form id="prescription-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("prescriptions.details")}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("prescriptions.patient")} required error={fieldErrors.patient_id}>
            <SelectInput value={form.patient_id} onChange={setField("patient_id")}>
              <option value="">{t("prescriptions.selectPatient")}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.first_name || ""} ${p.last_name || ""}`.trim() ||
                    `${t("prescriptions.patient")} #${p.id}`}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("prescriptions.doctor")} required error={fieldErrors.doctor_id}>
            <SelectInput value={form.doctor_id} onChange={setField("doctor_id")}>
              <option value="">{t("prescriptions.selectDoctor")}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {`Dr. ${d.first_name || ""} ${d.last_name || ""}`.trim() ||
                    `${t("prescriptions.doctor")} #${d.id}`}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label={t("prescriptions.medicalRecord")}
            required
            error={fieldErrors.medical_record_id}
          >
            <SelectInput
              value={form.medical_record_id}
              onChange={setField("medical_record_id")}
              disabled={!form.patient_id || loadingRecords}
            >
              <option value="">
                {!form.patient_id
                  ? t("prescriptions.selectPatientFirst")
                  : loadingRecords
                  ? t("prescriptions.loadingRecords")
                  : t("prescriptions.selectRecord")}
              </option>
              {medicalRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || r.diagnosis || `${t("prescriptions.record")} #${r.id}`}
                  {r.visit_date ? ` — ${r.visit_date}` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label={t("prescriptions.prescriptionDate")}
            required
            error={fieldErrors.prescription_date}
          >
            <TextInput
              type="date"
              value={form.prescription_date}
              onChange={setField("prescription_date")}
            />
          </Field>
        </div>

        <Field label={t("prescriptions.notes")}>
          <TextArea
            rows={2}
            placeholder={t("prescriptions.notesPlaceholder")}
            value={form.notes}
            onChange={setField("notes")}
          />
        </Field>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("prescriptions.medicines")}
          </h4>
          <Button variant="secondary" size="sm" onClick={addItem}>
            <Plus size={14} />
            {t("prescriptions.addMedicine")}
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const itemErr = fieldErrors.items?.[idx] || {};
            const selectedMedicine = medicineById[String(item.medicine_id)];
            return (
              <div
                key={item.key}
                className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {t("prescriptions.item")} {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-slate-400 transition-colors hover:text-red-600"
                      aria-label={t("prescriptions.removeItem")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={t("prescriptions.medicine")} error={itemErr.medicine_id}>
                    <SelectInput
                      value={item.medicine_id}
                      onChange={(e) => updateItem(item.key, "medicine_id", e.target.value)}
                    >
                      <option value="">{t("prescriptions.selectMedicine")}</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label={t("prescriptions.quantity")} error={itemErr.quantity}>
                    <TextInput
                      type="number"
                      min="1"
                      placeholder={t("prescriptions.quantityPlaceholder")}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, "quantity", e.target.value)}
                    />
                  </Field>

                  <Field label={t("prescriptions.dosage")} error={itemErr.dosage}>
                    <TextInput
                      type="text"
                      placeholder={t("prescriptions.dosagePlaceholder")}
                      value={item.dosage}
                      onChange={(e) => updateItem(item.key, "dosage", e.target.value)}
                    />
                  </Field>

                  <Field label={t("prescriptions.frequency")} error={itemErr.frequency}>
                    <TextInput
                      type="text"
                      placeholder={t("prescriptions.frequencyPlaceholder")}
                      value={item.frequency}
                      onChange={(e) => updateItem(item.key, "frequency", e.target.value)}
                    />
                  </Field>

                  <Field label={t("prescriptions.duration")} error={itemErr.duration}>
                    <TextInput
                      type="text"
                      placeholder={t("prescriptions.durationPlaceholder")}
                      value={item.duration}
                      onChange={(e) => updateItem(item.key, "duration", e.target.value)}
                    />
                  </Field>

                  <Field label={t("prescriptions.instruction")}>
                    <TextInput
                      type="text"
                      placeholder={t("prescriptions.instructionPlaceholder")}
                      value={item.instruction}
                      onChange={(e) => updateItem(item.key, "instruction", e.target.value)}
                    />
                  </Field>
                </div>

                {selectedMedicine?.unit && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {t("prescriptions.unit")}: {selectedMedicine.unit}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting || loadingLookups}>
          {editingId ? t("prescriptions.updateButton") : t("prescriptions.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
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
            {t("prescriptions.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pill : ClipboardList}
            title={formView === "edit" ? t("prescriptions.editTitle") : t("prescriptions.addTitle")}
            subtitle={
              formView === "edit"
                ? t("prescriptions.editSubtitle")
                : t("prescriptions.addSubtitle")
            }
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="prescription-form" loading={submitting}>
                  {editingId ? t("prescriptions.updateButton") : t("prescriptions.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {loadingLookups ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("common.loading")}
              </p>
            ) : (
              prescriptionForm
            )}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={ClipboardList}
            title={t("prescriptions.title")}
            subtitle={t("prescriptions.subtitle")}
            actions={
              canCreate && (
                <Button
                  onClick={openAdd}
                  className="transition-transform duration-150 active:scale-95"
                >
                  <Plus size={18} />
                  {t("prescriptions.addButton")}
                </Button>
              )
            }
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {error}
              <button
                onClick={fetchPrescriptions}
                className="ml-2 text-sm font-semibold underline hover:text-red-800"
              >
                {t("prescriptions.retry")}
              </button>
            </div>
          )}

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("prescriptions.searchPlaceholder")}
            className="max-w-md"
          />

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padded>
                  <div className="space-y-3">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </Card>
              ))}
            </div>
          ) : prescriptions.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {prescriptions.map((prescription) => {
                  const patientFull = patientName(prescription);
                  const doctorFull = doctorName(prescription);
                  const itemCount = (prescription.items || []).length;

                  return (
                    <Card key={prescription.id} padded className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          {prescription.patient?.avatar_url ? (
                            <img
                              src={prescription.patient.avatar_url}
                              alt={t("prescriptions.patient")}
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              {initials(
                                prescription.patient?.first_name,
                                prescription.patient?.last_name
                              )}
                            </div>
                          )}
                          <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                              {patientFull}
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                              {t("prescriptions.prescriptionNumber", { id: prescription.id })}
                              {doctorFull && (
                                <>
                                  {" "}
                                  &middot; Dr. {doctorFull}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {formatDate(prescription.prescription_date)}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            {t("prescriptions.medicinesCount", { count: itemCount })}
                          </span>
                        </div>
                      </div>

                      {prescription.notes && (
                        <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                          {prescription.notes}
                        </p>
                      )}

                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {t("prescriptions.prescribedMedicines")}
                        </h3>
                        {prescription.items && prescription.items.length > 0 ? (
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {prescription.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Pill size={14} />
                                  </div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {item.medicine?.name || t("prescriptions.unknownMedicine")}
                                  </p>
                                </div>
                                <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                                  <p>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                      {t("prescriptions.qty")}:
                                    </span>{" "}
                                    {item.quantity}
                                  </p>
                                  <p>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                      {t("prescriptions.dosage")}:
                                    </span>{" "}
                                    {item.dosage}
                                  </p>
                                  <p>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                      {t("prescriptions.frequency")}:
                                    </span>{" "}
                                    {item.frequency}
                                  </p>
                                  <p>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                      {t("prescriptions.duration")}:
                                    </span>{" "}
                                    {item.duration}
                                  </p>
                                </div>
                                <p className="border-t border-slate-200/60 pt-2 text-xs italic text-slate-500 dark:border-slate-700">
                                  {t("prescriptions.instruction")}:{" "}
                                  {item.instruction || t("prescriptions.instructionNone")}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400">
                            {t("prescriptions.noMedicines")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(prescription)}
                            title={t("common.edit")}
                            className="text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-950/40"
                          >
                            <Pencil size={14} />
                            {t("common.edit")}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(prescription)}
                            title={t("common.delete")}
                            className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                          >
                            <Trash2 size={14} />
                            {t("common.delete")}
                          </Button>
                        )}
                        {!canUpdate && !canDelete && (
                          <span className="text-xs text-slate-400">{t("common.viewOnly")}</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <Pagination
                page={meta.currentPage}
                totalPages={meta.lastPage}
                onPageChange={setPage}
                from={meta.from}
                to={meta.to}
                total={meta.total}
                label="prescriptions"
              />
            </>
          ) : (
            <Card padded className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <User size={22} />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {query
                  ? t("prescriptions.emptySearchTitle")
                  : t("prescriptions.emptyTitle")}
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                {query
                  ? t("prescriptions.emptySearchText")
                  : t("prescriptions.emptyText")}
              </p>
              {!query && canCreate && (
                <Button variant="secondary" className="mt-4" onClick={openAdd}>
                  <Plus size={16} />
                  {t("prescriptions.createFirst")}
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("prescriptions.deleteTitle")}
        subtitle={
          deleteTarget
            ? `${patientName(deleteTarget)} ${t("prescriptions.deleteSubtitle")}`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("prescriptions.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("prescriptions.deleteWarning")}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Prescriptions;
