import { useEffect, useState, useCallback } from "react";

import AppointmentTable from "../components/AppointmentTable";
import AppointmentModal from "../components/AppointmentModal";

import {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} from "../services/appointmentService";

import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

/* eslint-disable react-hooks/set-state-in-effect */

const Appointments = () => {
    const { user } = useAuth();
    // =========================
    // State
    // =========================

    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const [loading, setLoading] = useState(false);
    const canCreate = can(user, "appointments", "create");
    const canUpdate = can(user, "appointments", "update");
    const canDelete = can(user, "appointments", "delete");

    // =========================
    // Load Appointments
    // =========================

    const loadAppointments = useCallback(async () => {
        try {
            const response = await getAppointments({ search, status });
            setAppointments(response.data?.data?.data || response.data?.data || []);
        } catch (error) {
            console.error("Failed to load appointments:", error);
        }
    }, [search, status]);

    // =========================
    // Load Patients & Doctors
    // =========================

    const loadPatients = async () => {
        try {
            const response = await getPatients();
            setPatients(response.data?.data?.data || response.data?.data || []);
        } catch (error) {
            console.error("Failed to load patients:", error);
        }
    };

    const loadDoctors = async () => {
        try {
            const response = await getDoctors();
            setDoctors(response.data?.data?.data || response.data?.data || []);
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

    // =========================
    // Modal Handlers
    // =========================

    const handleCreate = () => {
        setSelectedAppointment(null);
        setIsModalOpen(true);
    };

    const handleEdit = (appointment) => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };

    // =========================
    // Create / Update Submit
    // =========================

    const handleSubmit = async (data) => {
        try {
            setLoading(true);

            if (selectedAppointment) {
                await updateAppointment(selectedAppointment.id, data);
                alert("Appointment updated successfully!");
            } else {
                await createAppointment(data);
                alert("Appointment created successfully!");
            }

            handleCloseModal();
            await loadAppointments();
        } catch (error) {
            console.error("Error saving appointment:", error);
            alert(
                error.response?.data?.message || "Failed to save appointment!"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // Delete Handler
    // =========================

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) {
            return;
        }

        try {
            await deleteAppointment(id);
            alert("Appointment deleted successfully!");
            await loadAppointments();
        } catch (error) {
            console.error(error);
            alert("Failed to delete appointment.");
        }
    };

    return (
        <div className="w-full">
            {/* Table component manages its own UI header & search */}
            <AppointmentTable
                appointments={appointments}
                search={search}
                setSearch={setSearch}
                status={status}
                setStatus={setStatus}
                onAdd={canCreate ? handleCreate : null}
                onEdit={canUpdate ? handleEdit : null}
                onDelete={canDelete ? handleDelete : null}
            />

            {/* Appointment Modal */}
            {(canCreate || canUpdate) && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    patients={patients}
                    doctors={doctors}
                    appointment={selectedAppointment}
                    onSubmit={handleSubmit}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default Appointments;
