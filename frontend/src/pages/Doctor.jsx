import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  User,
  Save,
  ChevronDown,
  Phone,
  Mail,
  BadgeCheck,
  Camera,
} from "lucide-react";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../services/doctorService";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

export default function Doctors() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  // Modal & Menu States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Departments loaded from the API so department_id always matches the DB.
  const [departmentList, setDepartmentList] = useState([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDepartments = async () => {
      try {
        const response = await api.get("/departments");
        const items = response.data?.data?.data || response.data?.data || response.data || [];
        const depts = Array.isArray(items) ? items : [];
        if (isMounted) {
          setDepartmentList(
            depts.map((d) => ({ id: d.id, name: d.name }))
          );
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
      } finally {
        if (isMounted) setDepartmentsLoaded(true);
      }
    };
    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  const firstDepartment = departmentList[0] || { id: "", name: "" };

  const initialFormState = {
    name: "",
    doctor_code: "",
    phone: "",
    email: "",
    department: firstDepartment.name,
    department_id: firstDepartment.id,
    specialization: "General Practitioner",
    license_number: "",
    gender: "male",
    date_of_birth: "",
    address: "",
    status: "active",
    avatar: "",
    bio: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [avatarFile, setAvatarFile] = useState(null);
  const canCreate = can(user, "doctors", "create");
  const canUpdate = can(user, "doctors", "update");
  const canDelete = can(user, "doctors", "delete");

  const specializationOptions = [
    "General Practitioner",
    "Cardiologist",
    "Neurologist",
    "Pediatrician",
    "Orthopedic Surgeon",
    "Dermatologist",
    "Psychiatrist",
    "Radiologist",
    "Anesthesiologist",
    "Oncologist",
  ];

  // Must match the backend's `doctors.status` ENUM('active', 'inactive', 'on_leave')
  // exactly — sending anything else causes a MySQL truncation error (500).
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "on_leave", label: "On Leave" },
  ];

  const BIO_MAX_LENGTH = 500;

  // Helper: safely turn doc.department (string OR object) into a display string
  const getDepartmentName = (doc) => {
    const raw = doc?.department;
    if (raw && typeof raw === "object") {
      return raw.name || raw.department_name || "General";
    }
    return raw || doc?.department_name || "General";
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDoctors = async () => {
      try {
        const response = await getDoctors();
        if (isMounted) {
          const fetchedData =
            response.data?.data?.data ||
            response.data?.data ||
            response.data ||
            [];
          setDoctors(Array.isArray(fetchedData) ? fetchedData : []);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        if (isMounted) setDoctors([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If Department changes, keep department_id and department name in sync
    if (name === "department_id") {
      const selectedDept = departmentList.find((d) => String(d.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        department_id: value,
        department: selectedDept ? selectedDept.name : prev.department,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
    setEditingDoctorId(null);
    setAvatarFile(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doctor) => {
    const deptName = getDepartmentName(doctor);
    const matchedDept = departmentList.find((d) => d.name.toLowerCase() === deptName.toLowerCase());

    setEditingDoctorId(doctor.id);
    setAvatarFile(null);
    setFormData({
      name: doctor.user?.name || doctor.name || doctor.full_name || "",
      doctor_code: doctor.doctor_code || doctor.code || "",
      phone: doctor.user?.phone || doctor.phone || "",
      email: doctor.user?.email || doctor.email || "",
      department: deptName,
      department_id: doctor.department_id || doctor.department?.id || (matchedDept ? matchedDept.id : ""),
      specialization: doctor.specialization || doctor.speciality || "General Practitioner",
      license_number: doctor.license_number || "",
      gender: doctor.gender || "male",
      date_of_birth: doctor.date_of_birth || "",
      address: doctor.address || "",
      status: (doctor.status || "active").toLowerCase(),
      avatar: doctor.avatar_url || doctor.avatar || doctor.image || "",
      bio: doctor.bio || doctor.description || "",
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.department_id) {
      alert("Please select a department.");
      return;
    }

    // If a new photo was picked, send multipart so the backend can store the
    // file; otherwise send the plain JSON payload as before.
    const payload = avatarFile
      ? (() => {
          const fd = new FormData();
          fd.append("name", formData.name);
          fd.append("email", formData.email);
          fd.append("phone", formData.phone || "");
          fd.append("department_id", Number(formData.department_id));
          fd.append("specialization", formData.specialization);
          fd.append("license_number", formData.license_number);
          fd.append("gender", formData.gender);
          fd.append("date_of_birth", formData.date_of_birth || "");
          fd.append("address", formData.address || "");
          fd.append("status", formData.status);
          fd.append("bio", formData.bio || "");
          fd.append("avatar", avatarFile);
          return fd;
        })()
      : {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          department_id: Number(formData.department_id),
          specialization: formData.specialization,
          license_number: formData.license_number,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || "",
          address: formData.address || "",
          status: formData.status,
          bio: formData.bio || "",
        };

    try {
      if (editingDoctorId) {
        const response = await updateDoctor(editingDoctorId, payload);
        const updatedDoc = response.data?.data || response.data;
        setDoctors((prev) =>
          prev.map((doc) =>
            doc.id === editingDoctorId ? { ...doc, ...payload, ...updatedDoc } : doc
          )
        );
      } else {
        const response = await createDoctor(payload);
        const newDoctor = response.data?.data || response.data;
        setDoctors((prev) => [{ ...payload, id: newDoctor.id || Date.now(), ...newDoctor }, ...prev]);
      }

      setIsModalOpen(false);
      setAvatarFile(null);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error saving doctor:", error);

      // Surface a detailed Laravel validation message when available
      const valErrors = error.response?.data?.errors;
      if (valErrors) {
        const firstMsg = Object.values(valErrors)[0][0];
        alert(`Validation Error: ${firstMsg}`);
      } else {
        alert(error.response?.data?.message || "Failed to save doctor details. Check server logs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setActiveMenuId(null);
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    try {
      await deleteDoctor(id);
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== id));
    } catch (error) {
      console.error("Error deleting doctor:", error);
      alert(error.response?.data?.message || "Failed to delete doctor.");
    }
  };

  // Filter List Logic
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = (doc.user?.name || doc.name || doc.full_name || "").toLowerCase();
      const code = (doc.doctor_code || doc.code || (doc.id ? `DOC-${4090 + doc.id}` : "")).toLowerCase();
      const specialization = (doc.specialization || doc.speciality || "").toLowerCase();

      const department = getDepartmentName(doc).toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        code.includes(search) ||
        specialization.includes(search) ||
        department.includes(search);

      const matchesDepartment =
        selectedDepartment === "All Departments" ||
        department === selectedDepartment.toLowerCase();

      return matchesSearch && matchesDepartment;
    });
  }, [doctors, searchTerm, selectedDepartment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage clinical staff, specializations, and availability.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
          >
            <UserPlus size={18} />
            <span>Add New Doctor</span>
          </button>
        )}
      </div>

      {/* Search & Filter Container */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Department Select */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All Departments">All Departments</option>
              {departmentList.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
              {departmentList.length === 0 && (
                <option value="All Departments">
                  {departmentsLoaded ? "No departments" : "Loading departments..."}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Filters and Export Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            title="Reset filters"
            onClick={() => {
              setSearchTerm("");
              setSelectedDepartment("All Departments");
            }}
            className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={18} />
          </button>
          <button
            type="button"
            title="Export CSV"
            onClick={() => {
              if (filteredDoctors.length === 0) return;
              const headers = ["Name", "Specialization", "Department", "Status"];
              const csv = [
                headers.join(","),
                ...filteredDoctors.map((doc) =>
                  [
                    doc.user?.name || doc.name || "",
                    doc.specialization || doc.speciality || "",
                    getDepartmentName(doc),
                    doc.status || "active",
                  ]
                    .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                    .join(",")
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "doctors.csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 tracking-wide">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Specialization</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <User size={28} />
                      <p className="text-slate-500 font-medium">No doctors found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const name =
                    doc.user?.name ||
                    doc.name ||
                    doc.full_name ||
                    "Dr. Unknown";
                  const code = doc.doctor_code || doc.code || `ID: DOC-${4090 + doc.id}`;
                  const specialization =
                    doc.specialization || doc.speciality || "General Practitioner";
                  // doc.department can be an object ({id, name, description, status, ...})
                  // instead of a plain string. Extract the name safely so React never tries
                  // to render an object directly.
                  const department = getDepartmentName(doc);
                  const rawStatus = doc.status || "active";
                  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                  const isActive = rawStatus.toLowerCase() === "active";
                  const isOnLeave = rawStatus.toLowerCase().includes("leave");

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & ID Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {doc.avatar_url || doc.avatar ? (
                            <img
                              src={doc.avatar_url || doc.avatar}
                              alt={name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-400 shrink-0">
                              <User size={20} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-blue-600 text-sm">
                              {name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {code.startsWith("ID:") ? code : `ID: ${code}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {specialization}
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {department}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isOnLeave
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : isOnLeave ? "bg-amber-500" : "bg-slate-400"
                            }`}
                          />
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === doc.id ? null : doc.id
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === doc.id && (
                          <div className="absolute right-6 top-12 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left">
                            {canUpdate && (
                              <button
                                onClick={() => handleOpenEditModal(doc)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(doc.id)}
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

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">1</span> to{" "}
            <span className="font-bold text-slate-800">
              {filteredDoctors.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {doctors.length || 45}
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
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingDoctorId ? "Edit Doctor" : "Add New Doctor"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editingDoctorId
                    ? "Update the details of this medical professional."
                    : "Enter the details to register a new medical professional."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* Identity Card: avatar + name + code */}
                <div className="border border-slate-200 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-900 pb-4 mb-5 border-b border-slate-100 flex items-center gap-2">
                    <User size={15} className="text-blue-600" />
                    Identity
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Avatar upload */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <label className="relative cursor-pointer group">
                        {formData.avatar ? (
                          <img
                            src={formData.avatar}
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <User size={28} />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white group-hover:bg-blue-700 transition-colors">
                          <Camera size={13} />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-400 font-medium">Photo</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          placeholder="Dr. Jane Doe"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Gender */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Gender
                          </label>
                          <div className="relative">
                            <select
                              name="gender"
                              value={formData.gender}
                              onChange={handleChange}
                              className="w-full appearance-none border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                            <ChevronDown
                              size={16}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information Card */}
                <div className="border border-slate-200 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-900 pb-4 mb-5 border-b border-slate-100 flex items-center gap-2">
                    <BadgeCheck size={15} className="text-blue-600" />
                    Professional Information
                  </h4>

                  <div className="space-y-5">
                    {/* Specialization & Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Specialization
                        </label>
                        <div className="relative">
                          <select
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            className="w-full appearance-none border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="">Select Specialization</option>
                            {specializationOptions.map((spec) => (
                              <option key={spec} value={spec}>
                                {spec}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Department
                        </label>
                        <div className="relative">
                          <select
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            className="w-full appearance-none border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                          >
                            {departmentList.length === 0 ? (
                              <option value="">
                                {departmentsLoaded ? "No departments" : "Loading departments..."}
                              </option>
                            ) : (
                              departmentList.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))
                            )}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* License & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          License Number
                        </label>
                        <input
                          type="text"
                          name="license_number"
                          value={formData.license_number}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          placeholder="e.g. MD-102938"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full appearance-none border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="border border-slate-200 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-900 pb-4 mb-5 border-b border-slate-100 flex items-center gap-2">
                    <Phone size={15} className="text-blue-600" />
                    Contact Information
                  </h4>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Contact Number
                        </label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="doctor@ngmclinic.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Street, city, country"
                      />
                    </div>

                    {/* Brief Bio */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Brief Bio
                        </label>
                        <span className="text-xs text-slate-400 font-medium">
                          {formData.bio.length}/{BIO_MAX_LENGTH}
                        </span>
                      </div>
                      <textarea
                        name="bio"
                        rows={4}
                        maxLength={BIO_MAX_LENGTH}
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                        placeholder="Provide a short professional background..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center gap-6 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/20 disabled:opacity-50 transition-colors"
                >
                  <Save size={16} />
                  <span>
                    {submitting
                      ? "Saving..."
                      : editingDoctorId
                      ? "Update Doctor Record"
                      : "Save Doctor Record"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}