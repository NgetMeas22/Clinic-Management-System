import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

const emptyForm = { name: "", description: "", status: "active" };

export default function Departments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/departments");
      setDepartments(response.data?.data?.data || []);
    } catch (err) {
      console.error("Failed to load departments", err);
      setError("Departments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDepartments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDepartments]);

  const save = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, form);
      } else {
        await api.post("/departments", form);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Department could not be saved.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await api.delete(`/departments/${id}`);
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Department could not be deleted.");
    }
  };

  const canCreate = can(user, "departments", "create");
  const canUpdate = can(user, "departments", "update");
  const canDelete = can(user, "departments", "delete");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
        <p className="text-sm text-slate-500">
          {canCreate ? "Manage clinic departments." : "View clinic departments."}
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {canCreate && (
        <form onSubmit={save} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-4">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? "Update" : "Add"} department
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-slate-500">Loading departments...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                {(canUpdate || canDelete) && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{department.name}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{department.description || "-"}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{department.status}</td>
                  {(canUpdate || canDelete) && (
                    <td className="space-x-3 p-4 text-right">
                      {canUpdate && <button onClick={() => { setEditingId(department.id); setForm({ name: department.name || "", description: department.description || "", status: department.status || "active" }); }} className="font-semibold text-blue-600">Edit</button>}
                      {canDelete && <button onClick={() => remove(department.id)} className="font-semibold text-red-600">Delete</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
