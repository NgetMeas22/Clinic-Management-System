import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Download,
  MoreVertical,
  Pencil,
  Phone,
  SlidersHorizontal,
  Stethoscope,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../services/doctorService";
import { getDepartments } from "../services/departmentService";
import { invalidateCache } from "../api/cache";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { can } from "../utils/permissions";
import {
  Badge,
  Button,
  Card,
  EmptyState,
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

const BIO_MAX_LENGTH = 500;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const EMPTY_FORM = {
  name: "",
  doctor_code: "",
  phone: "",
  email: "",
  department: "",
  department_id: "",
  specialization: "General Practitioner",
  license_number: "",
  gender: "male",
  date_of_birth: "",
  address: "",
  status: "active",
  avatar: "",
  bio: "",
};

const SPECIALIZATION_OPTIONS = [
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

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

function extractDepartments(response) {
  const { items } = unwrapPaginator(response);
  if (Array.isArray(items) && items.length) return items;

  const raw = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function DoctorsPageStyles() {
  return (
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96) translateY(-4px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      .animate-fade-up { animation: fadeInUp 0.4s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .doctors-anim, .doctors-anim *, .animate-fade-up {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  );
}

export default function Doctors() {
  const { user } = useAuth();
  const { localizedPath } = useLocale();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  const [formView, setFormView] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [closingMenu, setClosingMenu] = useState(false);
  const menuRef = useRef(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [departmentList, setDepartmentList] = useState([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(false);
  const [departmentsAttempt, setDepartmentsAttempt] = useState(0);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState(null);

  const canCreate = can(user, "doctors", "create");
  const canUpdate = can(user, "doctors", "update");
  const canDelete = can(user, "doctors", "delete");

  const getDepartmentName = (doc) => {
    const raw = doc?.department;
    if (raw && typeof raw === "object") {
      return raw.name || raw.department_name || "General";
    }
    return raw || doc?.department_name || "General";
  };

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      try {
        const response = await getDepartments({ per_page: 200 });
        if (!isMounted) return;
        const depts = extractDepartments(response)
          .filter((d) => d?.id)
          .map((d) => ({ id: d.id, name: d.name }));
        setDepartmentList(depts);
        setDepartmentsError(false);
      } catch (error) {
        console.error("Failed to load departments:", error);
        if (isMounted) setDepartmentsError(true);
      } finally {
        if (isMounted) setDepartmentsLoaded(true);
      }
    };

    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, [departmentsAttempt]);

  const retryLoadDepartments = () => {
    invalidateCache(["/departments"]);
    setDepartmentsLoaded(false);
    setDepartmentsError(false);
    setDepartmentsAttempt((n) => n + 1);
  };

  const fetchDoctors = useCallback(async () => {
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
      const { items, meta: nextMeta } = unwrapPaginator(response);
      setDoctors(items);
      setMeta(nextMeta);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
      setMeta({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedDepartment, departmentList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchDoctors();
      setPage(1);
    }, 120);
    return () => clearTimeout(timer);
  }, [fetchDoctors, searchTerm, selectedDepartment]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (formView !== "add") return;
    if (formData.department_id || departmentList.length !== 1) return;
    const only = departmentList[0];
    const timer = setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        department_id: only.id,
        department: only.name,
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [departmentList, formView, formData.department_id]);

  const closeMenu = () => {
    setClosingMenu(true);
    window.setTimeout(() => {
      setActiveMenuId(null);
      setClosingMenu(false);
    }, 120);
  };

  const toggleMenu = (id) => {
    if (activeMenuId === id) {
      closeMenu();
    } else {
      setActiveMenuId(id);
      setClosingMenu(false);
    }
  };

  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
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

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (formError) setFormError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setFormError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setFormError("Photo must be 2 MB or smaller.");
      return;
    }

    setAvatarFile(file);
    setFormError("");
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  const closeForm = () => {
    setFormView(null);
    setEditingDoctorId(null);
    setAvatarFile(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setFieldErrors({});
    setSubmitting(false);
  };

  const handleOpenAdd = () => {
    setEditingDoctorId(null);
    setAvatarFile(null);
    setFormError("");
    setFieldErrors({});
    setFormData(EMPTY_FORM);
    setFormView("add");
    if (departmentsError) retryLoadDepartments();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEdit = (doctor) => {
    const deptName = getDepartmentName(doctor);
    const matchedDept = departmentList.find((d) => d.name.toLowerCase() === deptName.toLowerCase());

    setEditingDoctorId(doctor.id);
    setAvatarFile(null);
    setFormError("");
    setFieldErrors({});
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
      date_of_birth: (doctor.date_of_birth || "").slice(0, 10),
      address: doctor.address || "",
      status: (doctor.status || "active").toLowerCase(),
      avatar: doctor.avatar_url || doctor.avatar || doctor.profile_picture || doctor.image || "",
      bio: doctor.bio || doctor.description || "",
    });
    setFormView("edit");
    closeMenu();
    if (departmentsError) retryLoadDepartments();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    const next = {};
    if (!formData.name.trim()) next.name = "Full name is required.";
    if (!formData.email.trim()) next.email = "Email is required.";
    if (!formData.phone.trim()) next.phone = "Contact number is required.";
    if (!formData.specialization) next.specialization = "Specialization is required.";
    if (!formData.department_id) next.department_id = "Please select a department.";
    if (!formData.license_number.trim()) next.license_number = "License number is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const fields = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department_id: Number(formData.department_id),
      specialization: formData.specialization,
      license_number: formData.license_number.trim(),
      gender: formData.gender,
      status: formData.status,
      address: formData.address.trim(),
    };
    if (formData.date_of_birth) fields.date_of_birth = formData.date_of_birth;
    if (formData.bio.trim()) fields.bio = formData.bio.trim();

    if (avatarFile) {
      const fd = new FormData();
      Object.entries(fields).forEach(([key, value]) => fd.append(key, value ?? ""));
      fd.append("avatar", avatarFile);
      return fd;
    }
    return fields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) {
      setFormError("Please fill in the required fields.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingDoctorId) {
        await updateDoctor(editingDoctorId, buildPayload());
        setToast("Doctor updated successfully.");
      } else {
        await createDoctor(buildPayload());
        setToast("Doctor added successfully.");
        setPage(1);
      }

      closeForm();
      await fetchDoctors();
    } catch (error) {
      console.error("Error saving doctor:", error);
      const valErrors = error.response?.data?.errors;
      if (valErrors) {
        const mapped = {};
        Object.entries(valErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFieldErrors(mapped);
        setFormError(Object.values(mapped)[0] || "Please check the form and try again.");
      } else {
        setFormError(error.response?.data?.message || "Failed to save doctor details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (doctor) => {
    closeMenu();
    setPendingDelete(doctor);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDoctor(pendingDelete.id);
      setShowDelete(false);
      setPendingDelete(null);
      setToast("Doctor deleted successfully.");
      await fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      setFormError(error.response?.data?.message || "Failed to delete doctor.");
      setShowDelete(false);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
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

  const statCards = useMemo(
    () => [
      {
        icon: Stethoscope,
        label: "Total doctors",
        value: meta.total,
        iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      },
      {
        icon: BadgeCheck,
        label: "Active",
        value: activeCount,
        iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      },
      {
        icon: User,
        label: "Departments",
        value: departmentList.length,
        iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
      },
    ],
    [meta.total, activeCount, departmentList.length]
  );

  const departmentField = (
    <Field label="Department" required error={fieldErrors.department_id}>
      {!departmentsLoaded ? (
        <div className="h-[42px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : departmentsError ? (
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle size={14} className="shrink-0" />
            Couldn't load departments
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={retryLoadDepartments}>
            Retry
          </Button>
        </div>
      ) : departmentList.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          No departments yet.{" "}
          <Link to={localizedPath("/departments")} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Create one first
          </Link>
          .
        </div>
      ) : (
        <SelectInput name="department_id" value={formData.department_id} onChange={handleChange}>
          <option value="">Select department</option>
          {departmentList.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </SelectInput>
      )}
    </Field>
  );

  const doctorForm = (
    <form id="doctor-form" onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="field-error flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Identity
        </h4>
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2 sm:pt-1">
            <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 transition-transform duration-200 group-hover:scale-105 dark:ring-slate-700"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:border-blue-400 group-hover:text-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:group-hover:border-blue-500">
                  <User size={32} />
                </div>
              )}
              <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white transition-colors group-hover:bg-blue-700 dark:ring-slate-900">
                <Camera size={14} />
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
            </label>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formData.avatar ? "Change photo" : "Add photo"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, WEBP · 2 MB</p>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <X size={12} />
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <Field label="Full Name" required error={fieldErrors.name}>
              <TextInput
                type="text"
                name="name"
                autoFocus
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Jane Doe"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Professional information
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Specialization" required error={fieldErrors.specialization}>
            <SelectInput name="specialization" value={formData.specialization} onChange={handleChange}>
              <option value="">Select specialization</option>
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </SelectInput>
          </Field>
          {departmentField}
          <Field label="License Number" required error={fieldErrors.license_number}>
            <TextInput
              type="text"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              placeholder="e.g. MD-102938"
            />
          </Field>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    formData.status === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={formData.status === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-4">
        <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Phone size={13} />
          Contact information
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Number" required error={fieldErrors.phone}>
            <TextInput
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label="Email Address" required error={fieldErrors.email}>
            <TextInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@ngmclinic.com"
            />
          </Field>
        </div>
        <Field label="Address">
          <TextInput
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street, city, country"
          />
        </Field>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Brief Bio
            </label>
            <span
              className={`text-xs font-medium transition-colors duration-150 ${
                formData.bio.length >= BIO_MAX_LENGTH ? "text-rose-500" : "text-slate-400"
              }`}
            >
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
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {formView === "edit" ? "Update Doctor" : "Save Doctor"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="doctors-anim space-y-6" key={formView || "list"}>
      <DoctorsPageStyles />

      {toast && (
        <div className="animate-fade-up fixed right-6 top-24 z-50 flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-slate-200 dark:shadow-slate-950/60">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          {toast}
        </div>
      )}

      {formView ? (
        <>
          <button
            type="button"
            onClick={closeForm}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to doctors
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : UserPlus}
            title={formView === "edit" ? "Edit Doctor" : "Add New Doctor"}
            subtitle={
              formView === "edit"
                ? "Update this medical professional's details."
                : "Enter the details to register a new medical professional."
            }
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" form="doctor-form" loading={submitting}>
                  {formView === "edit" ? "Update Doctor" : "Save Doctor"}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {doctorForm}
          </Card>
        </>
      ) : (
        <>
          <PageHeader
            icon={Stethoscope}
            title="Doctors Management"
            subtitle="Manage clinical staff, specializations, and availability."
            actions={
              canCreate && (
                <Button onClick={handleOpenAdd} className="transition-transform duration-150 active:scale-95">
                  <UserPlus size={18} />
                  Add New Doctor
                </Button>
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map(({ icon: Icon, label, value, iconClass }, index) => (
              <div key={label} className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
                <Card padded className="flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search doctors..." />
              <SelectInput
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full transition-colors duration-150 sm:w-52"
              >
                <option value="All Departments">All Departments</option>
                {departmentList.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
                {departmentList.length === 0 && (
                  <option value="All Departments">
                    {!departmentsLoaded
                      ? "Loading departments..."
                      : departmentsError
                      ? "Couldn't load departments"
                      : "No departments"}
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
                className="transition-transform duration-150 active:scale-90"
              >
                <SlidersHorizontal size={16} />
              </Button>
              <Button
                variant="secondary"
                onClick={exportCsv}
                title="Export CSV"
                className="transition-transform duration-150 active:scale-90"
              >
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
                      <td colSpan="5">
                        <EmptyState
                          icon={User}
                          title="No doctors found"
                          description="Try a different search, or add a new doctor to get started."
                          action={
                            canCreate && (
                              <Button className="mt-1" onClick={handleOpenAdd}>
                                <UserPlus size={16} />
                                Add New Doctor
                              </Button>
                            )
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doc) => {
                      const name = doc.user?.name || doc.name || doc.full_name || "Dr. Unknown";
                      const code = doc.doctor_code || doc.code || `DOC-${4090 + doc.id}`;
                      const specialization = doc.specialization || doc.speciality || "General Practitioner";
                      const department = getDepartmentName(doc);

                      return (
                        <tr
                          key={doc.id}
                          className="transition-colors duration-150 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {doc.avatar_url || doc.avatar || doc.profile_picture ? (
                                <img
                                  src={doc.avatar_url || doc.avatar || doc.profile_picture}
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
                              onClick={() => toggleMenu(doc.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              aria-haspopup="menu"
                              aria-expanded={activeMenuId === doc.id}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenuId === doc.id && (
                              <div
                                ref={menuRef}
                                role="menu"
                                className="absolute right-6 top-12 z-20 w-36 origin-top-right rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900"
                                style={{
                                  animation: closingMenu
                                    ? "scaleIn 0.12s ease-in reverse forwards"
                                    : "scaleIn 0.15s ease-out forwards",
                                }}
                              >
                                {canUpdate && (
                                  <button
                                    onClick={() => handleOpenEdit(doc)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors duration-100 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    role="menuitem"
                                  >
                                    <Pencil size={14} />
                                    <span>Edit</span>
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => confirmDelete(doc)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors duration-100 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    role="menuitem"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                )}
                                {!canUpdate && !canDelete && (
                                  <div className="px-3.5 py-2 text-xs font-semibold text-slate-500">View only</div>
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
        </>
      )}

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title="Delete this doctor?"
        subtitle={
          pendingDelete
            ? `${pendingDelete.user?.name || pendingDelete.name || "This doctor"} will be removed from the system.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
