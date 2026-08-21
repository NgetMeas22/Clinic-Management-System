import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
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

const MedicalRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);

  const canCreate = can(user, "medicalRecords", "create");
  const canUpdate = can(user, "medicalRecords", "update");
  const canDelete = can(user, "medicalRecords", "delete");

  const initialFormState = {
    patient_id: "",
    doctor_id: "",
    appointment_id: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const getPatientName = (patient) => {
    if (!patient) return "N/A";
    if (patient.name) return patient.name;
    const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    return fullName || "N/A";
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, per_page: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (selectedDiagnosis !== "All") params.diagnosis = selectedDiagnosis;

      const response = await medicalRecordService.getAll(params);
      const { items, meta } = unwrapPaginator(response);
      setRecords(items);
      setMeta(meta);
    } catch (error) {
      console.error("Failed to load medical records:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedDiagnosis]);

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
      } catch (error) {
        console.error("Failed to load medical record options:", error);
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    };

    loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch sets loading state
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset pagination on new filters
    setCurrentPage(1);
  }, [searchTerm, selectedDiagnosis]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setErrorMsg("");
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (record) => {
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
    setErrorMsg("");
    setIsFormModalOpen(true);
  };

  const handleFormField = (field) => (e) => setFormData((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      patient_id: Number(formData.patient_id),
      doctor_id: Number(formData.doctor_id),
      appointment_id: formData.appointment_id ? Number(formData.appointment_id) : null,
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms,
      treatment: formData.treatment,
      notes: formData.notes,
      visit_date: new Date().toISOString().split("T")[0],
    };

    try {
      if (editingId) {
        await medicalRecordService.update(editingId, payload);
      } else {
        await medicalRecordService.create(payload);
      }
      setIsFormModalOpen(false);
      fetchRecords();
    } catch (err) {
      console.error("Validation Error Details:", err.response?.data);

      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        if (validationErrors) {
          const firstError = Object.values(validationErrors).flat()[0];
          setErrorMsg(firstError);
        } else {
          setErrorMsg(err.response.data.message || "Validation failed");
        }
      } else {
        setErrorMsg("Server error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      await medicalRecordService.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("Failed to delete medical record.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Medical Records"
        subtitle="Manage, record, and inspect clinical diagnosis and patient history."
        actions={
          canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus size={18} />
              Add Medical Record
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search patient, doctor, diagnosis..."
          className="md:max-w-md"
        />
        <SelectInput
          value={selectedDiagnosis}
          onChange={(e) => setSelectedDiagnosis(e.target.value)}
          className="w-full md:w-56"
        >
          {["All", ...diagnosisOptions].map((diag) => (
            <option key={diag} value={diag}>
              {diag === "All" ? "All Diagnoses" : diag}
            </option>
          ))}
        </SelectInput>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-4 py-3.5 text-left">Patient</th>
                <th className="px-4 py-3.5 text-left">Attending Doctor</th>
                <th className="px-4 py-3.5 text-left">Diagnosis</th>
                <th className="px-4 py-3.5 text-left">Symptoms</th>
                <th className="px-4 py-3.5 text-left">Treatment</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
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
                            ID: #{record.patient_id || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate text-xs">
                          {record.doctor?.user?.name || record.doctor?.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone="emerald" label={record.diagnosis || "Unspecified"} dot={false} />
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {record.symptoms || "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {record.treatment || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                            title="Edit Record"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={26} strokeWidth={1.5} />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {searchTerm || selectedDiagnosis !== "All"
                          ? "No medical records match your search."
                          : "No medical records found."}
                      </p>
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

      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        icon={FileText}
        title="Medical Record Details"
        subtitle={
          selectedRecord?.created_at
            ? `Created at ${new Date(selectedRecord.created_at).toLocaleDateString()}`
            : ""
        }
        footer={
          <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
            Close
          </Button>
        }
      >
        {selectedRecord && (
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div>
                <span className="block text-xs text-slate-400">Patient Name</span>
                <strong className="text-slate-800 dark:text-white">
                  {getPatientName(selectedRecord.patient)}
                </strong>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Attending Doctor</span>
                <strong className="text-slate-800 dark:text-white">
                  {selectedRecord.doctor?.user?.name || selectedRecord.doctor?.name || "N/A"}
                </strong>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnosis</span>
              <p className="mt-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {selectedRecord.diagnosis || "Unspecified"}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Symptoms</span>
              <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                {selectedRecord.symptoms || "None recorded"}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Treatment Plan</span>
              <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                {selectedRecord.treatment || "None recorded"}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        icon={FileText}
        title={editingId ? "Edit Medical Record" : "Add New Medical Record"}
        subtitle={
          editingId
            ? "Update existing clinical entries below."
            : "Enter diagnostic details to register a new record."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || loadingLookups}
              type="submit"
              form="medical-record-form"
            >
              {submitting ? "Saving…" : editingId ? "Update Record" : "Save Record"}
            </Button>
          </>
        }
      >
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/80 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form id="medical-record-form" onSubmit={handleSubmit} className="space-y-5 text-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Patient">
              <SelectInput required value={formData.patient_id} onChange={handleFormField("patient_id")} disabled={loadingLookups}>
                <option value="">
                  {loadingLookups ? "Loading patients..." : "Select patient"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getPatientName(p)} #{p.id}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Doctor">
              <SelectInput required value={formData.doctor_id} onChange={handleFormField("doctor_id")} disabled={loadingLookups}>
                <option value="">
                  {loadingLookups ? "Loading doctors..." : "Select doctor"}
                </option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || d.name || `Doctor #${d.id}`}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Appointment">
              <SelectInput value={formData.appointment_id} onChange={handleFormField("appointment_id")} disabled={loadingLookups}>
                <option value="">
                  {loadingLookups ? "Loading appointments..." : "Optional — select appointment"}
                </option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} — {getPatientName(a.patient)} ({a.appointment_date})
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Field label="Primary Diagnosis">
            <TextInput
              type="text"
              required
              placeholder="e.g. Essential Hypertension (ICD-10 I10)"
              value={formData.diagnosis}
              onChange={handleFormField("diagnosis")}
            />
          </Field>

          <Field label="Observed Symptoms">
            <TextArea
              rows={3}
              placeholder="Describe presenting symptoms, severity, and duration..."
              value={formData.symptoms}
              onChange={handleFormField("symptoms")}
            />
          </Field>

          <Field label="Treatment Plan & Prescriptions">
            <TextArea
              rows={3}
              placeholder="Outline medication, dosages, or follow-up instructions..."
              value={formData.treatment}
              onChange={handleFormField("treatment")}
            />
          </Field>

          <Field label="Notes">
            <TextArea
              rows={2}
              placeholder="Optional additional notes"
              value={formData.notes}
              onChange={handleFormField("notes")}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
};

export default MedicalRecords;