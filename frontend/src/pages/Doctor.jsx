import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../services/doctorService";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  // Modal & Menu States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const initialFormState = {
    name: "",
    doctor_code: "",
    phone: "",
    email: "",
    department: "",
    department_id: "",
    specialization: "",
    license_number: "",
    gender: "male",
    date_of_birth: "",
    address: "",
    status: "Active",
    avatar: "",
    bio: "",
  };
  const [formData, setFormData] = useState(initialFormState);

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

  const departmentOptions = [
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingDoctorId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doctor) => {
    setEditingDoctorId(doctor.id);
    setFormData({
      name: doctor.user?.name || doctor.name || doctor.full_name || "",
      doctor_code: doctor.doctor_code || doctor.code || "",
      phone: doctor.user?.phone || doctor.phone || "",
      email: doctor.user?.email || doctor.email || "",
      department: getDepartmentName(doctor) || "Cardiology",
      department_id: doctor.department_id || doctor.department?.id || "1",
      specialization: doctor.specialization || doctor.speciality || "",
      license_number: doctor.license_number || "",
      gender: doctor.gender || "male",
      date_of_birth: doctor.date_of_birth || "",
      address: doctor.address || "",
      status: doctor.status || "Active",
      avatar: doctor.avatar || doctor.image || "",
      bio: doctor.bio || doctor.description || "",
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDoctorId) {
        const response = await updateDoctor(editingDoctorId, formData);
        const updatedDoc = response.data?.data || response.data;
        setDoctors((prev) =>
          prev.map((doc) =>
            doc.id === editingDoctorId ? { ...doc, ...formData, ...updatedDoc } : doc
          )
        );
      } else {
        const response = await createDoctor(formData);
        const newDoctor = response.data?.data || response.data;
        setDoctors((prev) => [{ ...formData, id: newDoctor.id || Date.now(), ...newDoctor }, ...prev]);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error saving doctor:", error);
      alert(error.response?.data?.message || "Failed to save doctor details.");
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
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading doctors...
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
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          <span>Add New Doctor</span>
        </button>
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
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>
          </div>
        </div>

        {/* Filters and Export Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <SlidersHorizontal size={18} />
          </button>
          <button className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
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
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No doctors found matching criteria.
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
                  // FIX: doc.department can be an object ({id, name, description, status, ...})
                  // instead of a plain string. Extract the name safely so React never tries
                  // to render an object directly.
                  const department = getDepartmentName(doc);
                  const status = doc.status || "Active";

                  const isActive = status.toLowerCase() === "active";
                  const isOnLeave = status.toLowerCase().includes("leave");

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & ID Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {doc.avatar ? (
                            <img
                              src={doc.avatar}
                              alt={name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
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
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : isOnLeave
                              ? "bg-rose-50 text-rose-600 border border-rose-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
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
                          <div className="absolute right-6 top-12 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left">
                            <button
                              onClick={() => handleOpenEditModal(doc)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-slate-100">
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                {/* Professional Information Card */}
                <div className="border border-slate-200 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-900 pb-4 mb-5 border-b border-slate-100">
                    Professional Information
                  </h4>

                  <div className="space-y-5">
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
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full appearance-none border border-slate-300 rounded-lg p-2.5 pr-9 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="">Select Department</option>
                            {departmentOptions.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
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

                    {/* Contact Number & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          placeholder="doctor@ngmclinic.com"
                        />
                      </div>
                    </div>

                    {/* Brief Bio */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Brief Bio
                      </label>
                      <textarea
                        name="bio"
                        rows={4}
                        maxLength={BIO_MAX_LENGTH}
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                        placeholder="Provide a short professional background..."
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Maximum {BIO_MAX_LENGTH} characters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center gap-6 px-6 py-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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