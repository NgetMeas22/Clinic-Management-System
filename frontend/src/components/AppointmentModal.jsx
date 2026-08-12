import { useEffect } from "react";
import { CalendarPlus, X, Loader2 } from "lucide-react";
import AppointmentForm from "./AppointmentForm";

const FORM_ID = "appointment-form";

const AppointmentModal = ({
  isOpen,
  onClose,
  patients,
  doctors,
  appointment,
  onSubmit,
  loading,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const isEditing = Boolean(appointment);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 animate-[slideUp_0.2s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h2
                id="appointment-modal-title"
                className="text-lg font-bold text-slate-900 leading-tight"
              >
                {isEditing ? "Edit Appointment" : "New Appointment"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditing
                  ? "Update the details for this consultation."
                  : "Schedule a new patient consultation."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body (scrollable fields) */}
        <div className="overflow-y-auto px-6 py-5">
          <AppointmentForm
            formId={FORM_ID}
            patients={patients}
            doctors={doctors}
            appointment={appointment}
            onSubmit={onSubmit}
            loading={loading}
          />
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form={FORM_ID}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : isEditing ? "Update Appointment" : "Create Appointment"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
};

export default AppointmentModal;