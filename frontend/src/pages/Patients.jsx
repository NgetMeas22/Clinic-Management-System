import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../services/patientService";

// Helper to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Helper for avatar initials
const getInitials = (firstName, lastName, name) => {
  if (firstName || lastName) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return "PT";
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Patients");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const initialFormState = {
    patient_code: "",
    first_name: "",
    last_name: "",
    gender: "female",
    phone: "",
    email: "",
    date_of_birth: "",
    address: "",
    status: "Active",
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    let isMounted = true;

    const fetchPatients = async () => {
      try {
        const response = await getPatients();
        if (isMounted) {
          const fetchedData =
            response.data?.data?.data ||
            response.data?.data ||
            response.data ||
            [];

          setPatients(Array.isArray(fetchedData) ? fetchedData : []);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        if (isMounted) setPatients([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open Modal for Creating Patient
  const handleOpenAddModal = () => {
    setEditingPatientId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  // Open Modal for Editing Patient
  const handleOpenEditModal = (patient) => {
    setEditingPatientId(patient.id);
    setFormData({
      patient_code: patient.patient_code || "",
      first_name: patient.first_name || patient.name?.split(" ")[0] || "",
      last_name:
        patient.last_name ||
        patient.name?.split(" ").slice(1).join(" ") ||
        "",
      gender: patient.gender ? patient.gender.toLowerCase() : "female",
      phone: patient.phone || "",
      email: patient.email || "",
      date_of_birth: patient.date_of_birth || "",
      address: patient.address || "",
      status: patient.status || "Active",
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  // Submit Form (Add / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      patient_code:
        formData.patient_code || `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    try {
      if (editingPatientId) {
        const response = await updatePatient(editingPatientId, payload);
        const updatedPatient = response.data?.data || response.data;
        setPatients((prev) =>
          prev.map((p) =>
            p.id === editingPatientId ? { ...p, ...payload, ...updatedPatient } : p
          )
        );
      } else {
        const response = await createPatient(payload);
        const newPatient = response.data?.data || response.data;
        setPatients((prev) => [{ ...payload, id: newPatient.id || Date.now(), ...newPatient }, ...prev]);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error saving patient:", error.response?.data);
      const serverMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join("\n")
          : null);

      alert(serverMessage || "Failed to save patient details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Patient
  const handleDelete = async (id) => {
    setActiveMenuId(null);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient record?"
    );

    if (!confirmDelete) return;

    try {
      await deletePatient(id);
      setPatients((prevPatients) => prevPatients.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  // Filter Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const fullName = (
        patient.name || `${patient.first_name || ""} ${patient.last_name || ""}`
      ).toLowerCase();
      const code = (patient.patient_code || `PT-${patient.id}`).toLowerCase();
      const phone = (patient.phone || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(search) || code.includes(search) || phone.includes(search);

      const patientStatus = patient.status || "Active";
      const matchesStatus =
        statusFilter === "All Patients" ||
        patientStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading patients...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage patient records, appointments, and medical history.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Filter / Search Bar Container */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All Patients">All Patients</option>
              <option value="Active">Active</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Patient Name / ID</th>
                <th className="py-3.5 px-6">Gender / Age</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No patients matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const fullName =
                    patient.name ||
                    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                    "Unnamed";
                  const code = patient.patient_code || `PT-2026-08${patient.id}`;
                  const age =
                    patient.age ||
                    calculateAge(patient.date_of_birth) ||
                    "32";
                  const gender = patient.gender || "Female";
                  const initials = getInitials(
                    patient.first_name,
                    patient.last_name,
                    fullName
                  );
                  const status = patient.status || "Active";
                  const isActive = status.toLowerCase() === "active";

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & ID Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-base">
                              {fullName}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gender / Age Column */}
                      <td className="py-4 px-6">
                        <div className="capitalize text-slate-800 font-medium">
                          {gender}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {age} yrs
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {patient.phone || "+1 (555) 000-0000"}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {patient.email || "patient@example.com"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === patient.id ? null : patient.id
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Action Popover Menu */}
                        {activeMenuId === patient.id && (
                          <div className="absolute right-6 top-12 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left">
                            <button
                              onClick={() => handleOpenEditModal(patient)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">1</span> to{" "}
            <span className="font-bold text-slate-800">
              {filteredPatients.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {filteredPatients.length}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled
              className="p-2 border border-slate-200 rounded-lg text-slate-300 disabled:opacity-50 cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center">
              2
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center">
              3
            </button>
            <span className="px-1 text-slate-400 text-xs">...</span>
            <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center">
              5
            </button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPatientId ? "Edit Patient Details" : "Add New Patient"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none capitalize"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingPatientId
                    ? "Update Patient"
                    : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}