import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
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
import { useLocale } from "../context/LocaleContext";
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

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function PatientsPageStyles() {
  return (
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-up { animation: fadeInUp 0.4s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-fade-up { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}

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
  const { t } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [statusFilter, setStatusFilter] = useState("All Patients");

  const [formView, setFormView] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  const [formData, setFormData] = useState(initialFormState);
  const canCreate = can(user, "patients", "create");
  const canUpdate = can(user, "patients", "update");
  const canDelete = can(user, "patients", "delete");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

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
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setFormErrors(t("patients.avatarType"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setFormErrors(t("patients.avatarSize"));
      return;
    }

    setAvatarFile(file);
    setFormErrors(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const closeForm = () => {
    setFormView(null);
    setEditingPatientId(null);
    setAvatarFile(null);
    setFormData(initialFormState);
    setFormErrors(null);
    setSubmitting(false);
  };

  const handleOpenAdd = () => {
    setEditingPatientId(null);
    setAvatarFile(null);
    setFormData(initialFormState);
    setFormErrors(null);
    setFormView("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEdit = (patient) => {
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
    setFormView("edit");
    setActiveMenuId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        setToast(t("patients.updatedSuccess"));
      } else {
        const response = await createPatient(payload);
        const newPatient = response.data?.data || response.data;
        setPatients((prev) => [
          { ...payload, id: newPatient?.id || Date.now(), ...newPatient },
          ...prev,
        ]);
        setToast(t("patients.createdSuccess"));
        setPage(1);
      }

      closeForm();
    } catch (error) {
      console.error("Error saving patient:", error.response?.data || error.message || error);
      const data = error.response?.data;
      const serverMessage =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(" ") : null) ||
        (error.response?.status === 500
          ? t("patients.serverError500")
          : null);
      setFormErrors(serverMessage || t("patients.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setActiveMenuId(null);
    setDeleteTarget(id);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deletePatient(deleteTarget);
      setShowDelete(false);
      setDeleteTarget(null);
      setToast(t("patients.deletedSuccess"));
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch (error) {
      console.error("Error deleting patient:", error.response?.data || error.message || error);
      setFormErrors(
        error.response?.data?.message ||
          (error.response?.status === 500 ? t("patients.deleteServerError") : t("patients.deleteError"))
      );
      setShowDelete(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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

  const activeCount = patients.filter((p) => p.status === "active").length;
  const maleCount = patients.filter((p) => p.gender === "male").length;

  const statCards = [
    {
      icon: Users,
      label: t("patients.total"),
      value: meta.total,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      icon: CheckCircle2,
      label: t("patients.active"),
      value: activeCount,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      icon: User,
      label: t("patients.male"),
      value: maleCount,
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
  ];

  const patientForm = (
    <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
      {formErrors && (
        <div className="field-error rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold whitespace-pre-line text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          {formErrors}
        </div>
      )}

      <section className="space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("patients.personalInfo")}
        </h4>
        <div className="flex items-center gap-4">
          <label className="group relative cursor-pointer shrink-0">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Avatar preview"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-800">
                <User size={32} />
              </div>
            )}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white transition-colors group-hover:bg-blue-700 dark:ring-slate-900">
              <Camera size={13} />
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
          </label>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t("patients.photo")}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, WEBP · 2 MB</p>
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
                {t("patients.remove")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("patients.firstName")} required>
            <TextInput type="text" name="first_name" autoFocus value={formData.first_name} onChange={handleChange} />
          </Field>
          <Field label={t("patients.lastName")} required>
            <TextInput type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
          </Field>
          <Field label={t("patients.code")}>
            <TextInput type="text" name="patient_code" value={formData.patient_code} onChange={handleChange} placeholder="PT-YYYY-XXXX" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label={t("patients.gender")} required>
            <SelectInput name="gender" value={formData.gender} onChange={handleChange}>
              <option value="female">{t("patients.genderFemale")}</option>
              <option value="male">{t("patients.genderMale")}</option>
              <option value="other">{t("patients.genderOther")}</option>
            </SelectInput>
          </Field>
          <Field label={t("patients.dob")}>
            <TextInput
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              max={toISODateString(new Date())}
            />
          </Field>
          <Field label={t("patients.bloodGroup")}>
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
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("patients.contactInfo")}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("patients.phone")}>
            <TextInput type="tel" name="phone" value={formData.phone} onChange={handleChange} />
          </Field>
          <Field label={t("patients.email")}>
            <TextInput type="email" name="email" value={formData.email} onChange={handleChange} />
          </Field>
        </div>
        <Field label={t("patients.address")}>
          <TextArea name="address" rows="2" value={formData.address} onChange={handleChange} />
        </Field>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("patients.emergency")}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("patients.emergencyContact")}>
            <TextInput type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
          </Field>
          <Field label={t("patients.emergencyPhone")}>
            <TextInput type="tel" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} />
          </Field>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      <section className="space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("patients.recordStatus")}
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
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {editingPatientId ? t("patients.updateButton") : t("patients.saveButton")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6" key={formView || "list"}>
      <PatientsPageStyles />

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
            {t("patients.backToList")}
          </button>

          <PageHeader
            icon={formView === "edit" ? Pencil : User}
            title={formView === "edit" ? t("patients.editTitle") : t("patients.addTitle")}
            subtitle={formView === "edit" ? t("patients.editSubtitle") : t("patients.addSubtitle")}
            actions={
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button variant="secondary" onClick={closeForm} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form="patient-form" loading={submitting}>
                  {editingPatientId ? t("patients.updateButton") : t("patients.saveButton")}
                </Button>
              </div>
            }
          />

          <Card padded className="mx-auto max-w-4xl">
            {patientForm}
          </Card>
        </>
      ) : (
        <>
      <PageHeader
        icon={Users}
        title={t("patients.title")}
        subtitle={`${meta.total} ${t("patients.total")}`}
        actions={
          canCreate && (
            <Button onClick={handleOpenAdd} className="transition-transform duration-150 active:scale-95">
              <Plus size={18} strokeWidth={2.5} />
              {t("patients.addButton")}
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
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, ID, phone…"
          />
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("patients.statusLabel")}:
            </span>
            <SelectInput
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="All Patients">{t("patients.allPatients")}</option>
              <option value="active">{t("patients.active")}</option>
              <option value="inactive">{t("patients.inactive")}</option>
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
            <span className="hidden sm:inline">{t("patients.filters")}</span>
          </Button>
          <Button variant="secondary" onClick={exportCsv} title="Export CSV">
            <Download size={16} />
            <span className="hidden sm:inline">{t("patients.export")}</span>
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5">{t("patients.thName")}</th>
                <th className="px-6 py-3.5">{t("patients.thGenderAge")}</th>
                <th className="px-6 py-3.5">{t("patients.thPhone")}</th>
                <th className="px-6 py-3.5">{t("patients.thEmail")}</th>
                <th className="px-6 py-3.5">{t("patients.thStatus")}</th>
                <th className="px-6 py-3.5 text-right">{t("patients.thActions")}</th>
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
                      <p className="font-medium text-slate-500 dark:text-slate-300">{t("patients.emptyTitle")}</p>
                      <p className="text-xs text-slate-400">{t("patients.emptyHint")}</p>
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
                                onClick={() => handleOpenEdit(patient)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Pencil size={14} />
                                <span>{t("common.edit")}</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => confirmDelete(patient.id)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 size={14} />
                                <span>{t("common.delete")}</span>
                              </button>
                            )}
                            {!canUpdate && !canDelete && (
                              <div className="px-3.5 py-2 text-xs font-semibold text-slate-500">
                                {t("common.viewOnly")}
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
      </>
      )}

      <Modal
        open={showDelete}
        onClose={() => {
          if (!deleting) {
            setShowDelete(false);
            setDeleteTarget(null);
          }
        }}
        icon={Trash2}
        title={t("patients.deleteTitle")}
        subtitle={t("patients.deleteSubtitle")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDelete(false);
                setDeleteTarget(null);
              }}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              {t("patients.confirmDelete")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("patients.deleteWarning")}
        </p>
      </Modal>
    </div>
  );
}