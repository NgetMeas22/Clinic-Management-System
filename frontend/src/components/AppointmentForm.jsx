import { useState } from "react";

const getInitialForm = (appointment) => ({
    patient_id: appointment?.patient_id || "",
    doctor_id: appointment?.doctor_id || "",
    appointment_date:
        appointment?.appointment_date?.substring(0, 10) || "",
    appointment_time:
        appointment?.appointment_time?.substring(0, 5) || "",
    reason: appointment?.reason || "",
    status: appointment?.status || "pending",
});

const AppointmentForm = ({
    patients,
    doctors,
    appointment,
    onSubmit,
    onCancel,
    loading,
}) => {

    const [form, setForm] = useState(() =>
        getInitialForm(appointment)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            ...form,
            patient_id: Number(form.patient_id),
            doctor_id: Number(form.doctor_id),
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >

            {/* Patient */}
            <div>
                <label className="block mb-1 font-medium">
                    Patient
                </label>

                <select
                    name="patient_id"
                    value={form.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                >
                    <option value="">
                        Select Patient
                    </option>

                    {patients.map((patient) => (
                        <option
                            key={patient.id}
                            value={patient.id}
                        >
                            {patient.first_name}{" "}
                            {patient.last_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Doctor */}
            <div>
                <label className="block mb-1 font-medium">
                    Doctor
                </label>

                <select
                    name="doctor_id"
                    value={form.doctor_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                >
                    <option value="">
                        Select Doctor
                    </option>

                    {doctors.map((doctor) => (
                        <option
                            key={doctor.id}
                            value={doctor.id}
                        >
                            Dr. {doctor.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date */}
            <div>
                <label className="block mb-1 font-medium">
                    Appointment Date
                </label>

                <input
                    type="date"
                    name="appointment_date"
                    value={form.appointment_date}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            {/* Time */}
            <div>
                <label className="block mb-1 font-medium">
                    Appointment Time
                </label>

                <input
                    type="time"
                    name="appointment_time"
                    value={form.appointment_time}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            {/* Reason */}
            <div>
                <label className="block mb-1 font-medium">
                    Reason
                </label>

                <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter reason..."
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            {/* Status */}
            <div>
                <label className="block mb-1 font-medium">
                    Status
                </label>

                <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                >
                    <option value="pending">
                        Pending
                    </option>

                    <option value="confirmed">
                        Confirmed
                    </option>

                    <option value="completed">
                        Completed
                    </option>

                    <option value="cancelled">
                        Cancelled
                    </option>
                </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3">

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 border rounded-lg"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading
                        ? "Saving..."
                        : appointment
                        ? "Update"
                        : "Create"}
                </button>

            </div>

        </form>
    );
};

export default AppointmentForm;