import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import userService from "../services/userService";
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
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Doctor", label: "Doctor" },
  { value: "Receptionist", label: "Receptionist" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "Doctor",
  status: "active",
  password: "",
};

export default function User() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useUrlSearch();
  const [selectedRole, setSelectedRole] = useState("All");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const canCreate = can(user, "users", "create");
  const canUpdate = can(user, "users", "update");
  const canDelete = can(user, "users", "delete");

  const loadUsers = async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");
      const response = await userService.getAll({
        search: searchTerm || undefined,
        role: selectedRole === "All" ? undefined : selectedRole,
        page: nextPage,
      });
      const paginator = response?.data || response || {};
      const rows = Array.isArray(paginator.data) ? paginator.data : [];
      setUsers(rows);
      setMeta({
        currentPage: paginator.current_page || 1,
        lastPage: paginator.last_page || 1,
        total: paginator.total || rows.length,
      });
      setPage(paginator.current_page || nextPage);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
      setError("We couldn't load users right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers(1);
    }, 250);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedRole]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      role: item.role?.name || "Doctor",
      status: item.status || "active",
      password: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        status: form.status,
      };

      if (!editingId || form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }

      closeModal();
      await loadUsers(page);
    } catch (err) {
      console.error("Failed to save user:", err);
      const firstError = Object.values(err.response?.data?.errors || {})[0]?.[0];
      setError(firstError || err.response?.data?.message || "Couldn't save this user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await userService.delete(deleteTarget.id);
      setShowDelete(false);
      await loadUsers(page);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const visibleUsers = useMemo(() => users, [users]);

  const handleFormField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Users"
        subtitle="Manage staff accounts and role access."
        actions={
          canCreate && (
            <Button onClick={openAdd}>
              <Plus size={18} />
              Add User
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, email, or phone..."
            className="w-full sm:max-w-sm"
          />
          <SelectInput
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-56"
          >
            <option value="All">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="text-sm text-slate-500 dark:text-slate-400">
          {meta.total.toLocaleString()} total user{meta.total === 1 ? "" : "s"}
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visibleUsers.length > 0 ? (
                visibleUsers.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.email}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {item.role?.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {item.phone || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={statusTone(item.status)} label={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            className="text-blue-600 hover:bg-blue-50! dark:text-blue-400 dark:hover:bg-blue-950/40!"
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                        )}
                        {canDelete && item.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(item);
                              setShowDelete(true);
                            }}
                            className="text-red-600 hover:bg-red-50! dark:text-red-400 dark:hover:bg-red-950/30!"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <UserCog size={22} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">No users found</p>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                          Try a different search or add a new account.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && meta.total > 0 && (
          <Pagination
            page={page}
            totalPages={meta.lastPage}
            onPageChange={(p) => loadUsers(p)}
            from={(page - 1) * 10 + 1}
            to={Math.min(page * 10, meta.total)}
            total={meta.total}
            label="users"
          />
        )}
      </Card>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        icon={UserCog}
        title={editingId ? "Edit User" : "Add User"}
        subtitle={editingId ? "Update account details and role." : "Create a new staff account."}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting} type="submit" form="user-form">
              {editingId ? "Update User" : "Save User"}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <TextInput type="text" required value={form.name} onChange={handleFormField("name")} placeholder="Full name" />
            </Field>
            <Field label="Email">
              <TextInput type="email" required value={form.email} onChange={handleFormField("email")} placeholder="user@clinic.com" />
            </Field>
            <Field label="Phone">
              <TextInput type="text" value={form.phone} onChange={handleFormField("phone")} placeholder="+1 (555) 000-0000" />
            </Field>
            <Field label="Role">
              <SelectInput value={form.role} onChange={handleFormField("role")}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={handleFormField("status")}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={editingId ? "New Password" : "Password"}>
              <TextInput
                type="password"
                required={!editingId}
                value={form.password}
                onChange={handleFormField("password")}
                placeholder={editingId ? "Leave blank to keep current password" : "Minimum 8 characters"}
              />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        size="sm"
        title="Delete this user?"
        subtitle={deleteTarget ? `${deleteTarget.name} will be removed from the system.` : ""}
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
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {deleteTarget ? `${deleteTarget.name} will be removed from the system.` : ""}
          </p>
        </div>
      </Modal>
    </div>
  );
}