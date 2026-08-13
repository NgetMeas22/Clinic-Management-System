import { useState } from "react";
import {
  User,
  Stethoscope,
  CalendarDays,
  Clock,
  FileText,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", dot: "bg-amber-500", ring: "ring-amber-500/30 bg-amber-50 text-amber-700" },
  { value: "confirmed", label: "Confirmed", dot: "bg-blue-500", ring: "ring-blue-500/30 bg-blue-50 text-blue-700" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500", ring: "ring-emerald-500/30 bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", dot: "bg-rose-500", ring: "ring-rose-500/30 bg-rose-50 text-rose-700" },
];

const getInitialForm = (appointment) => ({
  patient_id: appointment?.patient_id || "",
  doctor_id: appointment?.doctor_id || "",
  appointment_date: appointment?.appointment_date?.substring(0, 10) || "",
  appointment_time: appointment?.appointment_time?.substring(0, 5) || "",
  reason: appointment?.reason || "",
  status: appointment?.status || "pending",
});

const fieldLabel =
  "flex items-center gap-1.5 mb-1.5 text-sm font-semibold text-slate-700";

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

const AppointmentForm = ({
  formId,
  patients,
  doctors,
  appointment,
  onSubmit,
  loading,
}) => {
  const [form, setForm] = useState(() => getInitialForm(appointment));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setStatus = (value) => setForm((prev) => ({ ...prev, status: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      patient_id: Number(form.patient_id),
      doctor_id: Number(form.doctor_id),
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      {/* Patient & Doctor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={fieldLabel}>
            <User size={14} className="text-slate-400" />
            Patient
          </label>
          <select
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
            required
            disabled={loading}
            className={`${inputBase} px-3 disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel}>
            <Stethoscope size={14} className="text-slate-400" />
            Doctor
          </label>
          <select
            name="doctor_id"
            value={form.doctor_id}
            onChange={handleChange}
            required
            disabled={loading}
            className={`${inputBase} px-3 disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">Select doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.user?.name || doctor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={fieldLabel}>
            <CalendarDays size={14} className="text-slate-400" />
            Appointment Date
          </label>
          <input
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            required
            disabled={loading}
            className={`${inputBase} px-3 disabled:bg-slate-50 disabled:text-slate-400`}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            <Clock size={14} className="text-slate-400" />
            Appointment Time
          </label>
          <input
            type="time"
            name="appointment_time"
            value={form.appointment_time}
            onChange={handleChange}
            required
            disabled={loading}
            className={`${inputBase} px-3 disabled:bg-slate-50 disabled:text-slate-400`}
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className={fieldLabel}>
          <FileText size={14} className="text-slate-400" />
          Reason
        </label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows="3"
          disabled={loading}
          placeholder="e.g. Routine check-up, follow-up consultation..."
          className={`${inputBase} px-3 py-2.5 resize-none disabled:bg-slate-50 disabled:text-slate-400`}
        />
      </div>

      {/* Status */}
      <div>
        <label className={fieldLabel}>Status</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = form.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={loading}
                onClick={() => setStatus(opt.value)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ring-1 ring-inset ${
                  active
                    ? `border-transparent ${opt.ring}`
                    : "border-slate-200 text-slate-500 hover:bg-slate-50 ring-transparent"
                } disabled:opacity-50`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
};

export default AppointmentForm;