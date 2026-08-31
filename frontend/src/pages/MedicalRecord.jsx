import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import medicalRecordService from "../services/medicalRecordService";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
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
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const initialFormState = {
  patient_id: "",
  doctor_id: "",
  appointment_id: "",
  symptoms: "",
  diagnosis: "",
  treatment: "",
  notes: "",
};

function MedicalRecordsPageStyles() {
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

export default function MedicalRecords() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");

  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecord, setShowRecord] = useState(false);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);

  const canCreate = can(user, "medicalRecords", "create");
  const canUpdate = can(user, "medicalRecords", "update");
  const canDelete = can(user, "medicalRecords", "delete");

  const getPatientName = (patient) => {
    if (!patient) return "N/A";
    if (patient.name) return patient.name;
    const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    return fullName || "N/A";
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page: currentPage, per_page: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (selectedDiagnosis !== "All") params.diagnosis = selectedDiagnosis;
      const response = await medicalRecordService.getAll(params);
      const { items, meta } = unwrapPaginator(response);
      setRecords(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load medical records:", err);
      setError(t("medicalRecords.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedDiagnosis, t]);

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      try {
        setLoadingLookups(true);
        const [patientsRes, doctorsRes, appointmentsRes, allRecordsRes] = await Promise.all([
          getPatients({ per_page: 200 }),
          getDoctors({ per_page: 200 }),
          getAppointments({ per_page: 200 }),
          medicalRecordService.getAll({ per_page: 200 }),
        ]);
        if (isMounted) {
          setPatients(unwrapPaginator(patientsRes).items);
          setDoctors(unwrapPaginator(doctorsRes).items);
          setAppointments(unwrapPaginator(appointmentsRes).items);
          setDiagnosisOptions(
            Array.from(
              new Set(
                unwrapPaginator(allRecordsRes)
                  .items.map((r) => r.diagnosis)
                  .filter(Boolean)
              )
            )
          );
        }
      } catch (err) {
        console.error("Failed to load medical record options:", err);
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    };
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  const filterKey = `${searchTerm}|${selectedDiagnosis}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setCurrentPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRecords();
    }, 120);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const openAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setFormError("");
    setFieldErrors({});
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      patient_id: record.patient_id || record.patient?.id || "",
      doctor_id: record.doctor_id || record.doctor?.id || "",
      appointment_id: record.appointment_id || "",
      symptoms: record.symptoms || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    });
    setFormError("");
    setFieldErrors({});
    setFormView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setFormData(initialFormState);
    setFormError("");
    setFieldErrors({});
    setSubmitting(false);
  };

  const handleFormField = (field) => (e) => {
    setFormData((f) => ({ ...f, [field]: e.target.value }));
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
    if (!formData.patient_id) next.patient_id = t("medicalRecords.errorPatient");
    if (!formData.doctor_id) next.doctor_id = t("medicalRecords.errorDoctor");
    if (!formData.diagnosis.trim()) next.diagnosis = t("medicalRecords.errorDiagnosis");
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) {
      setFormError(t("medicalRecords.saveError"));
      return;
    }
    setSubmitting(true);
    setFormError("");

    const payload = {
      patient_id: Number(formData.patient_id),
      doctor_id: Number(formData.doctor_id),
      appointment_id: formData.appointment_id ? Number(formData.appointment_id) : null,
      diagnosis: formData.diagnosis.trim(),
      symptoms: formData.symptoms.trim(),
      treatment: formData.treatment.trim(),
      notes: formData.notes.trim(),
      visit_date: new Date().toISOString().split("T")[0],
    };

    try {
      if (editingId) {
        await medicalRecordService.update(editingId, payload);
        setToast(t("medicalRecords.updatedSuccess"));
      } else {
        await medicalRecordService.create(payload);
        setToast(t("medicalRecords.createdSuccess"));
        setCurrentPage(1);
      }
      closeForm();
      await fetchRecords();
    } catch (err) {
      const resErrors = err.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.entries(resErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(mapped);
        setFormError(Object.values(mapped)[0] || t("medicalRecords.saveError"));
      } else {
        setFormError(err.response?.data?.message || t("medicalRecords.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (record) => {
    setDeleteTarget(record);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await medicalRecordService.delete(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("medicalRecords.deletedSuccess"));
      await fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || t("medicalRecords.deleteServerError"));
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" key={formView || "list"}>
      <MedicalRecordsPageStyles />

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
            {t("medicalRecords.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : FileText}
            title={formView === "edit" ? t("medicalRecords.editTitle") : t("medicalRecords.addTitle")}
            subtitle={formView === "edit" ? t("medicalRecords.editSubtitle") : t("medicalRecords.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="medical-record-form" loading={submitting}>
                  {editingId ? t("medicalRecords.updateButton") : t("medicalRecords.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            <form id="medical-record-form" onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <section className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("medicalRecords.sectionPersonnel")}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label={t("medicalRecords.patient")} required error={fieldErrors.patient_id}>
                    <SelectInput required value={formData.patient_id} onChange={handleFormField("patient_id")} disabled={loadingLookups}>
                      <option value="">
                        {loadingLookups ? t("medicalRecords.loadingPatients") : t("medicalRecords.selectPatient")}
                      </option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getPatientName(p)} #{p.id}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label={t("medicalRecords.doctor")} required error={fieldErrors.doctor_id}>
                    <SelectInput required value={formData.doctor_id} onChange={handleFormField("doctor_id")} disabled={loadingLookups}>
                      <option value="">
                        {loadingLookups ? t("medicalRecords.loadingDoctors") : t("medicalRecords.selectDoctor")}
                      </option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.user?.name || d.name || `Doctor #${d.id}`}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label={t("medicalRecords.appointment")} error={fieldErrors.appointment_id}>
                    <SelectInput value={formData.appointment_id} onChange={handleFormField("appointment_id")} disabled={loadingLookups}>
                      <option value="">
                        {loadingLookups ? t("medicalRecords.loadingAppointments") : t("medicalRecords.selectAppointmentOptional")}
                      </option>
                      {appointments.map((a) => (
                        <option key={a.id} value={a.id}>
                          #{a.id} - {getPatientName(a.patient)} ({a.appointment_date})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>
              </section>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              <section className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("medicalRecords.sectionClinical")}
                </h4>
                <Field label={t("medicalRecords.primaryDiagnosis")} required error={fieldErrors.diagnosis}>
                  <TextInput
                    type="text"
                    autoFocus
                    placeholder={t("medicalRecords.diagnosisPlaceholder")}
                    value={formData.diagnosis}
                    onChange={handleFormField("diagnosis")}
                  />
                </Field>
                <Field label={t("medicalRecords.observedSymptoms")}>
                  <TextArea
                    rows={3}
                    placeholder={t("medicalRecords.symptomsPlaceholder")}
                    value={formData.symptoms}
                    onChange={handleFormField("symptoms")}
                  />
                </Field>
                <Field label={t("medicalRecords.treatmentPlan")}>
                  <TextArea
                    rows={3}
                    placeholder={t("medicalRecords.treatmentPlaceholder")}
                    value={formData.treatment}
                    onChange={handleFormField("treatment")}
                  />
                </Field>
                <Field label={t("medicalRecords.notes")}>
                  <TextArea
                    rows={2}
                    placeholder={t("medicalRecords.notesPlaceholder")}
                    value={formData.notes}
                    onChange={handleFormField("notes")}
                  />
                </Field>
              </section>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingId ? t("medicalRecords.updateButton") : t("medicalRecords.saveButton")}
                </Button>
              </div>
            </form>
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={FileText}
            title={t("medicalRecords.title")}
            subtitle={t("medicalRecords.subtitle")}
            actions={
              canCreate && (
                <Button onClick={openAdd} className="transition-transform duration-150 active:scale-95">
                  <Plus size={18} />
                  {t("medicalRecords.addButton")}
                </Button>
              )
            }
          />

          <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t("medicalRecords.searchPlaceholder")}
                className="md:max-w-md"
              />
              <SelectInput
                value={selectedDiagnosis}
                onChange={(e) => setSelectedDiagnosis(e.target.value)}
                className="w-full md:w-56"
              >
                <option value="All">{t("medicalRecords.allDiagnoses")}</option>
                {diagnosisOptions.map((diag) => (
                  <option key={diag} value={diag}>
                    {diag}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {meta.total.toLocaleString()} {t("medicalRecords.totalRecord")}
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
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-4 py-3.5 text-left">{t("medicalRecords.colPatient")}</th>
                    <th className="px-4 py-3.5 text-left">{t("medicalRecords.colDoctor")}</th>
                    <th className="px-4 py-3.5 text-left">{t("medicalRecords.colDiagnosis")}</th>
                    <th className="px-4 py-3.5 text-left">{t("medicalRecords.colSymptoms")}</th>
                    <th className="px-4 py-3.5 text-left">{t("medicalRecords.colTreatment")}</th>
                    <th className="px-4 py-3.5 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : records.length > 0 ? (
                    records.map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
                              <User size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                {getPatientName(record.patient)}
                              </div>
                              <span className="block text-[10px] text-slate-400">
                                ID: #{record.patient_id || "-"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope size={14} className="shrink-0 text-slate-400" />
                            <span className="truncate text-xs">
                              {record.doctor?.user?.name || record.doctor?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone="emerald" label={record.diagnosis || t("medicalRecords.unspecified")} dot={false} />
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {record.symptoms || "-"}
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {record.treatment || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowRecord(true);
                              }}
                              className="text-slate-600 hover:bg-slate-50! dark:text-slate-400 dark:hover:bg-slate-800/40!"
                            >
                              <Eye size={14} />
                            </Button>
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(record)}
                                className="text-blue-600 hover:bg-blue-50! dark:text-blue-400 dark:hover:bg-blue-950/40!"
                              >
                                <Pencil size={14} />
                                {t("common.edit")}
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(record)}
                                className="text-red-600 hover:bg-red-50! dark:text-red-400 dark:hover:bg-red-950/30!"
                              >
                                <Trash2 size={14} />
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
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-16">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <FileText size={22} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-600 dark:text-slate-300">
                              {searchTerm || selectedDiagnosis !== "All"
                                ? t("medicalRecords.emptySearchTitle")
                                : t("medicalRecords.emptyTitle")}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {searchTerm || selectedDiagnosis !== "All"
                                ? t("medicalRecords.emptySearchText")
                                : t("medicalRecords.emptyText")}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && records.length > 0 && (
              <Pagination
                page={meta.currentPage}
                totalPages={meta.lastPage}
                onPageChange={setCurrentPage}
                from={meta.from}
                to={meta.to}
                total={meta.total}
                label="records"
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        icon={FileText}
        title={t("medicalRecords.recordDetailsTitle")}
        subtitle={
          selectedRecord?.created_at
            ? `${t("medicalRecords.createdAt")} ${new Date(selectedRecord.created_at).toLocaleDateString()}`
            : ""
        }
        footer={
          <Button variant="secondary" onClick={() => setShowRecord(false)}>
            {t("common.cancel")}
          </Button>
        }
      >
        {selectedRecord && (
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div>
                <span className="block text-xs text-slate-400">{t("medicalRecords.patientName")}</span>
                <strong className="text-slate-800 dark:text-white">
                  {getPatientName(selectedRecord.patient)}
                </strong>
              </div>
              <div>
                <span className="block text-xs text-slate-400">{t("medicalRecords.attendingDoctor")}</span>
                <strong className="text-slate-800 dark:text-white">
                  {selectedRecord.doctor?.user?.name || selectedRecord.doctor?.name || "-"}
                </strong>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("medicalRecords.diagnosis")}</span>
              <p className="mt-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {selectedRecord.diagnosis || t("medicalRecords.unspecified")}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("medicalRecords.symptomsLabel")}</span>
              <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                {selectedRecord.symptoms || t("medicalRecords.noneRecorded")}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("medicalRecords.treatmentPlanLabel")}</span>
              <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                {selectedRecord.treatment || t("medicalRecords.noneRecorded")}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("medicalRecords.deleteTitle")}
        subtitle={
          deleteTarget
            ? `${getPatientName(deleteTarget.patient)} ${t("medicalRecords.deleteSubtitle")}`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("medicalRecords.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("medicalRecords.deleteWarning")}
          </p>
        </div>
      </Modal>
    </div>
  );
}