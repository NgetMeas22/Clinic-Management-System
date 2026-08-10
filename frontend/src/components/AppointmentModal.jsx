import AppointmentForm from "./AppointmentForm";

const AppointmentModal = ({
  isOpen,
  onClose,
  patients,
  doctors,
  appointment,
  onSubmit,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            {appointment ? "Edit Appointment" : "Create Appointment"}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-xl" aria-label="Close modal">
            ×
          </button>
        </div>

        <AppointmentForm
          patients={patients}
          doctors={doctors}
          appointment={appointment}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AppointmentModal;
