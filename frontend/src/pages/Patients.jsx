import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Download,
  MoreVertical,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../services/patientService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  SelectInput,
  TextInput,
  TextArea,
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

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

const toISODateString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const AVATAR_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-600", dark: "dark:bg-blue-900/40 dark:text-blue-300" },
  { bg: "bg-violet-100", text: "text-violet-600", dark: "dark:bg-violet-900/40 dark:text-violet-300" },
  { bg: "bg-teal-100", text: "text-teal-600", dark: "dark:bg-teal-900/40 dark:text-teal-300" },
  { bg: "bg-amber-100", text: "text-amber-600", dark: "dark:bg-amber-900/40 dark:text-amber-300" },
  { bg: "bg-rose-100", text: "text-rose-600", dark: "dark:bg-rose-900/40 dark:text-rose-300" },
];
const getAvatarColor = (key) => {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[Math.abs(hash)];
};

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
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [statusFilter, setStatusFilter] = useState("All Patients");

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
        const params = { page, per_page: 10 };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter !== "All Patients") params.status = statusFilter;

        const response = await getPatients(params);
        if (isMounted) {
          const { items, meta } = unwrapPaginator(response);
          setPatients(items);
          setMeta(meta);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        if (isMounted) {
          setPatients([]);
          setMeta({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPatients();
    return () => {
      isMounted = false;
    };
  }, [page, searchTerm, statusFilter]);

  const filterKey = `${searchTerm}|${statusFilter}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

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
      last_name: patient.last_name || patient.name?.split(" ").slice(1).join(" ") || "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormErrors("First name and last name are required.");
      return;
    }

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
          prev.map((p) => (p.id === editingPatientId ? { ...p, ...payload, ...updatedPatient } : p))
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

  const exportCsv = () => {
    if (patients.length === 0) return;
    const headers = ["ID", "Name", "Gender", "Age", "Phone", "Email", "Status"];
    const csv = [
      headers.join(","),
      ...patients.map((p) =>
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Patients"
        subtitle={`${meta.total} total`}
        actions={
          canCreate && (
            <Button onClick={handleOpenAddModal}>
              <Plus size={18} strokeWidth={2.5} />
              Add New Patient
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, ID, phone…"
          />
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
              Status:
            </span>
            <SelectInput
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="All Patients">All Patients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All Patients");
            }}
            title="Reset filters"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button variant="secondary" onClick={exportCsv} title="Export CSV">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5">Patient Name / ID</th>
                <th className="px-6 py-3.5">Gender / Age</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={28} strokeWidth={1.5} />
                      <p className="font-medium text-slate-500 dark:text-slate-300">No patients match your search</p>
                      <p className="text-xs text-slate-400">Try adjusting the search term or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const fullName =
                    patient.name ||
                    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
                    "Unnamed";
                  const code = patient.patient_code || `PT-${String(patient.id).padStart(4, "0")}`;
                  const age = calculateAge(patient.date_of_birth);
                  const gender = patient.gender || "—";
                  const initials = getInitials(patient.first_name, patient.last_name, fullName);
                  const avatarColor = getAvatarColor(patient.id ?? fullName);

                  return (
                    <tr key={patient.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {patient.avatar_url || patient.avatar ? (
                            <img
                              src={patient.avatar_url || patient.avatar}
                              alt={fullName}
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor.bg} ${avatarColor.text} ${avatarColor.dark}`}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                              {fullName}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-slate-400">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium capitalize text-slate-800 dark:text-slate-200">{gender}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {age !== null ? `${age} yrs` : "Age unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                        {patient.phone || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                        {patient.email || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(patient.status)} label={patient.status} />
                      </td>
                      <td className="relative px-6 py-4 text-right">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === patient.id ? null : patient.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                          aria-label="Row actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === patient.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-12 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900"
                          >
                            {canUpdate && (
                              <button
                                onClick={() => handleOpenEditModal(patient)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(patient.id)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
        <Pagination
          page={meta.currentPage}
          totalPages={meta.lastPage}
          onPageChange={setPage}
          from={meta.from}
          to={meta.to}
          total={meta.total}
          label="patients"
        />
      </Card>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        icon={Users}
        title={editingPatientId ? "Edit Patient Details" : "Add New Patient"}
        subtitle={
          editingPatientId ? "Update this patient's information." : "Enter the patient's information to create a new record."
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {submitting ? "Saving…" : editingPatientId ? "Update Patient" : "Save Patient"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formErrors && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold whitespace-pre-line text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
              {formErrors}
            </div>
          )}

          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h4>
            <div className="flex items-center gap-4">
              <label className="group relative cursor-pointer shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    <User size={24} />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white transition-colors group-hover:bg-blue-700 dark:ring-slate-900">
                  <Camera size={12} />
                </span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Patient Photo</p>
                <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, or WEBP up to 2 MB.</p>
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
              <Field label="First Name" required>
                <TextInput type="text" name="first_name" required value={formData.first_name} onChange={handleChange} />
              </Field>
              <Field label="Last Name" required>
                <TextInput type="text" name="last_name" required value={formData.last_name} onChange={handleChange} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Gender" required>
                <SelectInput name="gender" required value={formData.gender} onChange={handleChange}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </SelectInput>
              </Field>
              <Field label="Date of Birth">
                <TextInput
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={toISODateString(new Date())}
                />
              </Field>
              <Field label="Blood Group">
                <SelectInput name="blood_group" value={formData.blood_group} onChange={handleChange}>
                  <option value="">—</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone Number">
                <TextInput type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </Field>
              <Field label="Email Address">
                <TextInput type="email" name="email" value={formData.email} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Address">
              <TextArea name="address" rows="2" value={formData.address} onChange={handleChange} />
            </Field>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Emergency Contact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <TextInput type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
              </Field>
              <Field label="Contact Phone">
                <TextInput type="tel" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} />
              </Field>
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Record Status
            </h4>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    formData.status === opt
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                    className={`h-1.5 w-1.5 rounded-full ${formData.status === opt ? "bg-blue-600" : "bg-slate-300"}`}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}