import { useState } from "react";
import { Field, SelectInput, TextArea, TextInput } from "../components/ui";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", dot: "bg-amber-500", ring: "ring-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  { value: "confirmed", label: "Confirmed", dot: "bg-blue-500", ring: "ring-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500", ring: "ring-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { value: "cancelled", label: "Cancelled", dot: "bg-rose-500", ring: "ring-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
];

const getInitialForm = (appointment) => ({
  patient_id: appointment?.patient_id || "",
  doctor_id: appointment?.doctor_id || "",
  appointment_date: appointment?.appointment_date?.substring(0, 10) || "",
  appointment_time: appointment?.appointment_time?.substring(0, 5) || "",
  reason: appointment?.reason || "",
  status: appointment?.status || "pending",
});

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
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Patient">
          <SelectInput
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Doctor">
          <SelectInput
            name="doctor_id"
            value={form.doctor_id}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.user?.name || doctor.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Appointment Date">
          <TextInput
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Field>

        <Field label="Appointment Time">
          <TextInput
            type="time"
            name="appointment_time"
            value={form.appointment_time}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </Field>
      </div>

      <Field label="Reason">
        <TextArea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows={3}
          disabled={loading}
          placeholder="e.g. Routine check-up, follow-up consultation..."
        />
      </Field>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
    </form>
  );
};

export default AppointmentForm;