import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2, Inbox } from "lucide-react";
import api from "../services/api";
import { cachedGet, invalidateCache } from "../api/cache";
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
  Table,
  TextArea,
  TextInput,
  statusTone,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const emptyForm = { name: "", description: "", status: "active" };
const ITEMS_PER_PAGE = 6;

export default function Departments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useUrlSearch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: ITEMS_PER_PAGE };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await cachedGet("/departments", { params });
      const { items, meta } = unwrapPaginator(response);
      setDepartments(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load departments", err);
      setError("Departments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDepartments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDepartments]);

  const handleOpenAddModal = () => {
    setError("");
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dept) => {
    setError("");
    const targetId = dept.id || dept._id;
    if (!targetId) {
      setError("Cannot edit: Invalid department ID.");
      return;
    }
    setEditingId(targetId);
    setForm({
      name: dept.name || "",
      description: dept.description || "",
      status: dept.status || "active",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setIsModalOpen(false);
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, form);
      } else {
        await api.post("/departments", form);
      }
      invalidateCache(["/departments"]);

      closeModal();
      await loadDepartments();
    } catch (err) {
      if (err.response?.status === 404) {
        closeModal();
        setError("Department not found or was already deleted.");
        await loadDepartments();
        return;
      }

      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const firstErrorMsg = Object.values(validationErrors)[0][0];
        setError(firstErrorMsg);
      } else {
        setError(err.response?.data?.message || "Department could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this department?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/departments/${id}`);
      invalidateCache(["/departments"]);
      if (editingId === id) closeModal();
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Department could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  const canCreate = can(user, "departments", "create");
  const canUpdate = can(user, "departments", "update");
  const canDelete = can(user, "departments", "delete");

  const activeCount = departments.filter((d) => d.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Departments"
        subtitle={canCreate ? "Manage clinic departments and operational structure." : "View clinic departments list."}
        actions={
          canCreate && (
            <Button onClick={handleOpenAddModal}>
              <Plus size={18} />
              Add Department
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total departments</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{meta.total}</p>
          </div>
        </Card>
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{activeCount}</p>
          </div>
        </Card>
        <Card padded className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inactive</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{departments.length - activeCount}</p>
          </div>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          placeholder="Search departments..."
        />
        <div className="flex items-center gap-3">
          <SelectInput
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectInput>
        </div>
      </Card>

      <Table
        loading={loading}
        rows={departments}
        rowKey={(row) => row.id || row._id}
        columns={[
          { key: "name", header: "Department Name" },
          { key: "description", header: "Description" },
          { key: "status", header: "Status" },
          ...(canUpdate || canDelete ? [{ key: "actions", header: "", align: "right" }] : []),
        ]}
        emptyIcon={<Inbox size={24} className="text-slate-400" />}
        emptyTitle="No departments found"
        emptyDescription="Try adjusting your search or filter parameters."
        renderRow={(dept) => {
          const targetId = dept.id || dept._id;
          return (
            <>
              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{dept.name}</td>
              <td className="max-w-md truncate px-5 py-4 text-slate-600 dark:text-slate-300">
                {dept.description || <span className="italic text-slate-400">No description</span>}
              </td>
              <td className="px-5 py-4">
                <Badge tone={statusTone(dept.status)} label={dept.status} />
              </td>
              {(canUpdate || canDelete) && (
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)} title="Edit">
                        <Pencil size={15} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === targetId}
                        onClick={() => remove(targetId)}
                        title="Delete"
                        className="hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30"
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </>
          );
        }}
      />

      <Pagination
        page={meta.currentPage}
        totalPages={meta.lastPage}
        onPageChange={setCurrentPage}
        from={meta.from}
        to={meta.to}
        total={meta.total}
        label="departments"
      />

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        icon={Building2}
        title={editingId ? "Update Department" : "Create New Department"}
        subtitle={editingId ? "Update the department's details." : "Add a new department to the clinic."}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} type="submit" form="department-form">
              {saving ? "Saving…" : editingId ? "Update Department" : "Save Department"}
            </Button>
          </>
        }
      >
        <form id="department-form" onSubmit={save} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <Field label="Department Name" required>
            <TextInput
              placeholder="e.g., Cardiology"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Description">
            <TextArea
              rows={3}
              placeholder="Brief description of responsibilities..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Status">
            <SelectInput
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </Field>
        </form>
      </Modal>
    </div>
  );
}