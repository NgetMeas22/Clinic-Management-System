import { useEffect, useState, useRef } from "react";
import {
  BadgeCheck,
  Camera,
  Download,
  MoreVertical,
  Pencil,
  Phone,
  SlidersHorizontal,
  Stethoscope,
  Trash2,
  User,
  UserPlus,
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
  TextArea,
  TextInput,
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  const [departmentList, setDepartmentList] = useState([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDepartments = async () => {
      try {
        const response = await api.get("/departments", { params: { per_page: 200 } });
        const { items } = unwrapPaginator(response);
        const depts = Array.isArray(items) ? items : [];
        if (isMounted) {
          setDepartmentList(depts.map((d) => ({ id: d.id, name: d.name })));
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

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "on_leave", label: "On Leave" },
  ];

  const BIO_MAX_LENGTH = 500;

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
        const params = { page, per_page: 10 };
        if (searchTerm) params.search = searchTerm;
        if (selectedDepartment !== "All Departments") {
          const dept = departmentList.find(
            (d) => d.name.toLowerCase() === selectedDepartment.toLowerCase()
          );
          if (dept) params.department_id = dept.id;
        }

        const response = await getDoctors(params);
        if (isMounted) {
          const { items, meta } = unwrapPaginator(response);
          setDoctors(items);
          setMeta(meta);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        if (isMounted) {
          setDoctors([]);
          setMeta({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoctors();

    return () => {
      isMounted = false;
    };
  }, [page, searchTerm, selectedDepartment, departmentList]);

  const filterKey = `${searchTerm}|${selectedDepartment}`;
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
    const { name, value } = e.target;

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
    if (submitting) return;

    if (!formData.department_id) {
      alert("Please select a department.");
      return;
    }

    if (!formData.license_number.trim()) {
      alert("License number is required.");
      return;
    }

    setSubmitting(true);

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
          prev.map((doc) => (doc.id === editingDoctorId ? { ...doc, ...payload, ...updatedDoc } : doc))
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

  const activeCount = doctors.filter((d) => (d.status || "active").toLowerCase() === "active").length;

  const exportCsv = () => {
    if (doctors.length === 0) return;
    const headers = ["Name", "Specialization", "Department", "Status"];
    const csv = [
      headers.join(","),
      ...doctors.map((doc) =>
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Stethoscope}
        title="Doctors Management"
        subtitle="Manage clinical staff, specializations, and availability."
        actions={
          canCreate && (
            <Button onClick={handleOpenAddModal}>
              <UserPlus size={18} />
              Add New Doctor
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Stethoscope size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total doctors</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{meta.total}</p>
          </div>
        </Card>
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{activeCount}</p>
          </div>
        </Card>
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <User size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Departments</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{departmentList.length}</p>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search doctors..."
          />
          <SelectInput
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-52"
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
          </SelectInput>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setSelectedDepartment("All Departments");
            }}
            title="Reset filters"
          >
            <SlidersHorizontal size={16} />
          </Button>
          <Button variant="secondary" onClick={exportCsv} title="Export CSV">
            <Download size={16} />
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Specialization</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <User size={28} strokeWidth={1.5} />
                      <p className="font-medium text-slate-500 dark:text-slate-300">No doctors found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const name = doc.user?.name || doc.name || doc.full_name || "Dr. Unknown";
                  const code = doc.doctor_code || doc.code || `DOC-${4090 + doc.id}`;
                  const specialization = doc.specialization || doc.speciality || "General Practitioner";
                  const department = getDepartmentName(doc);

                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {doc.avatar_url || doc.avatar ? (
                            <img
                              src={doc.avatar_url || doc.avatar}
                              alt={name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-400 dark:border-blue-900 dark:bg-blue-950/40">
                              <User size={20} />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{name}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-400">ID: {code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{specialization}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{department}</td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(doc.status)} label={doc.status} />
                      </td>
                      <td className="relative px-6 py-4 text-right">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === doc.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-12 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900"
                          >
                            {canUpdate && (
                              <button
                                onClick={() => handleOpenEditModal(doc)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(doc.id)}
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
          label="doctors"
        />
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        icon={User}
        title={editingDoctorId ? "Edit Doctor" : "Add New Doctor"}
        subtitle={
          editingDoctorId
            ? "Update the details of this medical professional."
            : "Enter the details to register a new medical professional."
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} type="submit" form="doctor-form">
              {submitting ? "Saving…" : editingDoctorId ? "Update Doctor Record" : "Save Doctor Record"}
            </Button>
          </>
        }
      >
        <form id="doctor-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <h4 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
              <User size={15} className="text-blue-600" />
              Identity
            </h4>
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <label className="group relative cursor-pointer">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar preview"
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                      <User size={28} />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white transition-colors group-hover:bg-blue-700 dark:ring-slate-900">
                    <Camera size={13} />
                  </span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <span className="text-xs font-medium text-slate-400">Photo</span>
              </div>

              <div className="flex-1 space-y-4">
                <Field label="Full Name">
                  <TextInput
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. Jane Doe"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Gender">
                    <SelectInput name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </SelectInput>
                  </Field>
                  <Field label="Date of Birth">
                    <TextInput type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <h4 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
              <BadgeCheck size={15} className="text-blue-600" />
              Professional Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Specialization">
                <SelectInput name="specialization" value={formData.specialization} onChange={handleChange}>
                  <option value="">Select Specialization</option>
                  {specializationOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Department">
                <SelectInput name="department_id" value={formData.department_id} onChange={handleChange}>
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
                </SelectInput>
              </Field>
              <Field label="License Number" required>
                <TextInput
                  type="text"
                  name="license_number"
                  required
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="e.g. MD-102938"
                />
              </Field>
              <Field label="Status">
                <SelectInput name="status" value={formData.status} onChange={handleChange}>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <h4 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
              <Phone size={15} className="text-blue-600" />
              Contact Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Number">
                <TextInput
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </Field>
              <Field label="Email Address">
                <TextInput
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@ngmclinic.com"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Address">
                <TextInput type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street, city, country" />
              </Field>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Brief Bio
                </label>
                <span className="text-xs font-medium text-slate-400">
                  {formData.bio.length}/{BIO_MAX_LENGTH}
                </span>
              </div>
              <TextArea
                name="bio"
                rows={4}
                maxLength={BIO_MAX_LENGTH}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Provide a short professional background..."
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}