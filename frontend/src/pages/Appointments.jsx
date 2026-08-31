import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import AppointmentTable from "../components/AppointmentTable";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../services/appointmentService";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { can } from "../utils/permissions";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";
import {
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
} from "../components/ui";

const EMPTY_FORM = {
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  appointment_time: "",
  reason: "",
  status: "pending",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", dot: "bg-amber-500", ring: "ring-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  { value: "confirmed", label: "Confirmed", dot: "bg-blue-500", ring: "ring-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500", ring: "ring-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { value: "cancelled", label: "Cancelled", dot: "bg-rose-500", ring: "ring-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
];

/* eslint-disable react-hooks/set-state-in-effect */

const Appointments = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [search, setSearch] = useUrlSearch();
  const [status, setStatus] = useState("");

  const [formView, setFormView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreate = can(user, "appointments", "create");
  const canUpdate = can(user, "appointments", "update");
  const canDelete = can(user, "appointments", "delete");

  const loadAppointments = useCallback(async () => {
    try {
      const response = await getAppointments({
        page,
        per_page: 10,
        search: search || undefined,
        status: status || undefined,
      });
      const { items, meta } = unwrapPaginator(response);
      setAppointments(items);
      setMeta(meta);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      setAppointments([]);
      setMeta({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
    }
  }, [page, search, status]);

  const loadPatients = async () => {
    try {
      const response = await getPatients({ per_page: 200 });
      setPatients(unwrapPaginator(response).items);
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await getDoctors({ per_page: 200 });
      setDoctors(unwrapPaginator(response).items);
    } catch (error) {
      console.error("Failed to load doctors:", error);
    }
  };

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (appointment) => {
    setEditingId(appointment.id);
    setForm({
      patient_id: appointment.patient_id || "",
      doctor_id: appointment.doctor_id || "",
      appointment_date: appointment.appointment_date?.substring(0, 10) || "",
      appointment_time: appointment.appointment_time?.substring(0, 5) || "",
      reason: appointment.reason || "",
      status: appointment.status || "pending",
    });
    setFormError("");
    setFormView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormView(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSubmitting(false);
  };

  const handleFormField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
      };

      if (editingId) {
        await updateAppointment(editingId, payload);
        setToast(t("appointments.updatedSuccess"));
      } else {
        await createAppointment(payload);
        setToast(t("appointments.createdSuccess"));
        setPage(1);
      }

      closeForm();
      await loadAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      const resErrors = error.response?.data?.errors;
      if (resErrors) {
        const mapped = {};
        Object.entries(resErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFormError(Object.values(mapped)[0] || t("appointments.saveError"));
      } else {
        setFormError(error.response?.data?.message || t("appointments.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (appointment) => {
    setDeleteTarget(appointment);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("appointments.deletedSuccess"));
      await loadAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setFormError(error.response?.data?.message || t("appointments.deleteServerError"));
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const getPatientName = (item) => {
    const p = item.patient;
    if (!p) return t("appointments.unassignedPatient");
    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return name || t("appointments.unassignedPatient");
  };

  const getDoctorName = (item) => {
    const d = item.doctor;
    if (!d) return t("appointments.unassignedDoctor");
    const displayName = d.user?.name || d.name;
    return displayName ? `Dr. ${displayName}` : t("appointments.unassignedDoctor");
  };

  const appointmentForm = (
    <form id="appointment-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <CalendarPlus size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("appointments.sectionPatient")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("appointments.fieldPatient")} required>
            <SelectInput
              name="patient_id"
              value={form.patient_id}
              onChange={handleFormField("patient_id")}
              required
              disabled={submitting}
            >
              <option value="">{t("appointments.selectPatient")}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t("appointments.fieldDoctor")} required>
            <SelectInput
              name="doctor_id"
              value={form.doctor_id}
              onChange={handleFormField("doctor_id")}
              required
              disabled={submitting}
            >
              <option value="">{t("appointments.selectDoctor")}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.user?.name || doctor.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Clock size={13} />
          {t("appointments.sectionSchedule")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("appointments.fieldDate")} required>
            <TextInput
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleFormField("appointment_date")}
              required
              disabled={submitting}
            />
          </Field>
          <Field label={t("appointments.fieldTime")} required>
            <TextInput
              type="time"
              name="appointment_time"
              value={form.appointment_time}
              onChange={handleFormField("appointment_time")}
              required
              disabled={submitting}
            />
          </Field>
        </div>
        <Field label={t("appointments.fieldReason")}>
          <TextArea
            name="reason"
            value={form.reason}
            onChange={handleFormField("reason")}
            rows={3}
            disabled={submitting}
            placeholder={t("appointments.reasonPlaceholder")}
          />
        </Field>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("appointments.sectionStatus")}
        </h4>
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_OPTIONS.map((opt) => {
              const active = form.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, status: opt.value }));
                    if (formError) setFormError("");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ring-1 ring-inset ${
                    active
                      ? `border-transparent ${opt.ring}`
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 ring-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  } disabled:opacity-50`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {editingId ? t("appointments.updateButton") : t("appointments.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
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
            {t("appointments.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : CalendarPlus}
            title={formView === "edit" ? t("appointments.editTitle") : t("appointments.addTitle")}
            subtitle={formView === "edit" ? t("appointments.editSubtitle") : t("appointments.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="appointment-form" loading={submitting}>
                  {editingId ? t("appointments.updateButton") : t("appointments.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {appointmentForm}
          </Card>
        </>
      ) : (
        <AppointmentTable
          appointments={appointments}
          meta={meta}
          onPageChange={setPage}
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          onAdd={canCreate ? openAdd : null}
          onEdit={canUpdate ? openEdit : null}
          onDelete={canDelete ? confirmDelete : null}
        />
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title={t("appointments.deleteTitle")}
        subtitle={
          deleteTarget
            ? `${getPatientName(deleteTarget)} — ${getDoctorName(deleteTarget)}`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t("appointments.confirmDelete")}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("appointments.deleteWarning")}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;
