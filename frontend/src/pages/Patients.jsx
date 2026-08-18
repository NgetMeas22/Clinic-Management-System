import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from "react-router-dom";
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
  Users,
  User,
  Camera,
} from "lucide-react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../services/patientService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

// ---------- Helpers ----------

// Calculate age from a date of birth
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Normalize any incoming date value to YYYY-MM-DD (what <input type="date"> and most APIs expect)
const toISODateString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Use local date parts so we don't shift a day due to UTC conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Avatar initials
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

// Deterministic soft accent color per patient, based on id/name — for a bit of visual variety
const AVATAR_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
];
const getAvatarColor = (key) => {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[Math.abs(hash)];
};

// NOTE: these values are constrained by the DB schema:
//   gender ENUM('male','female','other')
//   status ENUM('active','inactive')
// Sending anything outside these exact lowercase values (e.g. "Active",
// "Discharged") causes a 500 on the API since MySQL rejects the enum value.
const initialFormState = {
  patient_code: "",
  first_name: "",
  last_name: "",
  gender: "female",
  date_of_birth: "",
  blood_group: "",
  phone: "",
  email: "",
  address: "",
  avatar: "",
  emergency_contact: "",
  emergency_phone: "",
  status: "active",
};

const STATUS_OPTIONS = ["active", "inactive"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Patients() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("All Patients");

  // Modal & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const menuRef = useRef(null);

  const [formData, setFormData] = useState(initialFormState);
  const canCreate = can(user, "patients", "create");
  const canUpdate = can(user, "patients", "update");
  const canDelete = can(user, "patients", "delete");

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
        if (isMounted) setLoading(false);
      }
    };

    fetchPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close the row action menu when clicking outside of it
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Reads a selected image file for preview + keeps it for multipart upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingPatientId(null);
    setAvatarFile(null);
    setFormData(initialFormState);
    setFormErrors(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient) => {
    setEditingPatientId(patient.id);
    setAvatarFile(null);
    setFormData({
      patient_code: patient.patient_code || "",
      first_name: patient.first_name || patient.name?.split(" ")[0] || "",
      last_name:
        patient.last_name || patient.name?.split(" ").slice(1).join(" ") || "",
      gender: patient.gender ? patient.gender.toLowerCase() : "female",
      date_of_birth: toISODateString(patient.date_of_birth) || "",
      blood_group: patient.blood_group || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      avatar: patient.avatar_url || patient.avatar || "",
      emergency_contact: patient.emergency_contact || "",
      emergency_phone: patient.emergency_phone || "",
      status: patient.status ? patient.status.toLowerCase() : "active",
    });
    setFormErrors(null);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors(null);
  };

  // ---------- Submit (create / update) ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors(null);

    // Basic client-side guard before hitting the API
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormErrors("First name and last name are required.");
      return;
    }

    // If a new photo was picked, send multipart so the backend can store the
    // file; otherwise send the plain JSON payload as before.
    const basePayload = {
      patient_code:
        formData.patient_code ||
        (editingPatientId
          ? patients.find((p) => p.id === editingPatientId)?.patient_code
          : `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      gender: formData.gender.toLowerCase(),
      date_of_birth: toISODateString(formData.date_of_birth),
      blood_group: formData.blood_group || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      emergency_contact: formData.emergency_contact.trim() || null,
      emergency_phone: formData.emergency_phone.trim() || null,
      status: formData.status.toLowerCase(),
    };

    const payload = avatarFile
      ? (() => {
          const fd = new FormData();
          Object.entries(basePayload).forEach(([key, value]) => {
            if (value !== null && value !== undefined) fd.append(key, value);
          });
          fd.append("avatar", avatarFile);
          return fd;
        })()
      : basePayload;

    setSubmitting(true);
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
        setPatients((prev) => [
          { ...payload, id: newPatient?.id || Date.now(), ...newPatient },
          ...prev,
        ]);
      }

      setIsModalOpen(false);
      setAvatarFile(null);
      setFormData(initialFormState);
    } catch (error) {
      // Log the full response so the real backend validation/SQL error is visible
      // in devtools instead of just "Request failed with status code 500".
      console.error("Error saving patient:", error.response?.data || error.message || error);

      const data = error.response?.data;
      const serverMessage =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(" ") : null) ||
        (error.response?.status === 500
          ? "Server error (500). Check the browser console and API logs — this usually means a field value doesn't match what the database expects (e.g. an enum column)."
          : null);

      setFormErrors(serverMessage || "Failed to save patient details. Please check the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setActiveMenuId(null);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient record? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting patient:", error.response?.data || error.message || error);
      const message =
        error.response?.data?.message ||
        (error.response?.status === 500
          ? "Server error (500). This patient likely has related records (appointments, records, etc.) that need to be removed first, or the delete failed on the server — check the API logs."
          : "Failed to delete patient. Please try again.");
      alert(message);
    }
  };

  // ---------- Derived data ----------
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

      const patientStatus = patient.status || "active";
      const matchesStatus =
        statusFilter === "All Patients" ||
        patientStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const activeCount = useMemo(
    () => patients.filter((p) => (p.status || "active").toLowerCase() === "active").length,
    [patients]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading patients…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {patients.length} total &middot; {activeCount} active
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New Patient</span>
          </button>
        )}
      </div>

      {/* Filter / search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All Patients">All Patients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            title="Reset filters"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All Patients");
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            type="button"
            title="Export CSV"
            onClick={() => {
              if (filteredPatients.length === 0) return;
              const headers = ["ID", "Name", "Gender", "Age", "Phone", "Email", "Status"];
              const csv = [
                headers.join(","),
                ...filteredPatients.map((p) =>
                  [
                    p.patient_code || p.id,
                    `${p.first_name || ""} ${p.last_name || ""}`.trim(),
                    p.gender || "",
                    calculateAge(p.date_of_birth) ?? "",
                    p.phone || "",
                    p.email || "",
                    p.status || "active",
                  ]
                    .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                    .join(",")
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "patients.csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
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
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={28} strokeWidth={1.5} />
                      <p className="text-slate-500 font-medium">No patients match your search</p>
                      <p className="text-xs text-slate-400">Try adjusting the search term or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const fullName =
                    patient.name ||
                    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                    "Unnamed";
                  const code = patient.patient_code || `PT-${String(patient.id).padStart(4, "0")}`;
                  const age = calculateAge(patient.date_of_birth);
                  const gender = patient.gender || "—";
                  const initials = getInitials(patient.first_name, patient.last_name, fullName);
                  const status = patient.status || "active";
                  const isActive = status.toLowerCase() === "active";
                  const avatarColor = getAvatarColor(patient.id ?? fullName);

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {patient.avatar_url || patient.avatar ? (
                            <img
                              src={patient.avatar_url || patient.avatar}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full ${avatarColor.bg} ${avatarColor.text} font-bold flex items-center justify-center text-xs shrink-0`}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-base leading-tight">
                              {fullName}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">{code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="capitalize text-slate-800 font-medium">{gender}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {age !== null ? `${age} yrs` : "Age unknown"}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {patient.phone || <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {patient.email || <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-blue-600" : "bg-slate-400"}`} />
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === patient.id ? null : patient.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          aria-label="Row actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === patient.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-12 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left"
                          >
                            {canUpdate && (
                              <button
                                onClick={() => handleOpenEditModal(patient)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(patient.id)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            )}
                            {!canUpdate && !canDelete && (
                              <div className="px-3.5 py-2 text-xs font-semibold text-slate-500">
                                View only
                              </div>
                            )}
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredPatients.length ? 1 : 0}</span> to{" "}
            <span className="font-bold text-slate-800">{filteredPatients.length}</span> of{" "}
            <span className="font-bold text-slate-800">{filteredPatients.length}</span> entries
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
            <button
              disabled
              className="p-2 border border-slate-200 rounded-lg text-slate-300 disabled:opacity-50 cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPatientId ? "Edit Patient Details" : "Add New Patient"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingPatientId
                    ? "Update this patient's information."
                    : "Enter the patient's information to create a new record."}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6">
              {formErrors && (
                <div className="px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 whitespace-pre-line">
                  {formErrors}
                </div>
              )}

              {/* Personal information */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Personal Information
                </h4>
                {/* Photo upload */}
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer group shrink-0">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <User size={24} />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white group-hover:bg-blue-700 transition-colors">
                      <Camera size={12} />
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Patient Photo</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, or WEBP up to 2 MB.
                    </p>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setFormData((prev) => ({ ...prev, avatar: "" }));
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none capitalize cursor-pointer"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      max={toISODateString(new Date())}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">—</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact information */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow resize-none"
                  />
                </div>
              </div>

              {/* Emergency contact */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Record status */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Record Status</h4>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold capitalize cursor-pointer transition-colors ${
                        formData.status === opt
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={opt}
                        checked={formData.status === opt}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          formData.status === opt ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {submitting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {submitting ? "Saving…" : editingPatientId ? "Update Patient" : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}