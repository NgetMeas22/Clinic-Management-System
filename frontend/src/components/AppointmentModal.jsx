import { CalendarPlus } from "lucide-react";
import AppointmentForm from "./AppointmentForm";
import { Button, Modal } from "../components/ui";

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
  const isEditing = Boolean(appointment);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      icon={CalendarPlus}
      title={isEditing ? "Edit Appointment" : "New Appointment"}
      subtitle={
        isEditing
          ? "Update the details for this consultation."
          : "Schedule a new patient consultation."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={loading}
          >
            {isEditing ? "Update Appointment" : "Create Appointment"}
          </Button>
        </>
      }
    >
      <AppointmentForm
        formId={FORM_ID}
        patients={patients}
        doctors={doctors}
        appointment={appointment}
        onSubmit={onSubmit}
        loading={loading}
      />
    </Modal>
  );
};

export default AppointmentModal;