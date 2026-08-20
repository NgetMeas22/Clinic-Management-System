import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Package,
  PackageX,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import medicineService from "../services/medicineService";
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
  TextArea,
  TextInput,
} from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

const formatDate = (d) => {
  if (!d) return "N/A";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();
const isLowStock = (quantity) => Number(quantity) <= 10;

const emptyForm = {
  name: "",
  category: "",
  description: "",
  quantity: "",
  unit: "",
  price: "",
  expiry_date: "",
};

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <Card padded className="flex items-center gap-3">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </Card>
);

const Inventory = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useUrlSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = can(user, "medicines", "create");
  const canUpdate = can(user, "medicines", "update");
  const canDelete = can(user, "medicines", "delete");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await medicineService.getAll({ search: search || undefined });
      setMedicines(response?.data || []);
    } catch (err) {
      console.error("Failed to load medicines:", err);
      setError("We couldn’t load the inventory. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadMedicines();
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset pagination on new search
    setPage(1);
  }, [search]);

  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStockCount = medicines.filter((m) => isLowStock(m.quantity)).length;
    const expiredCount = medicines.filter((m) => isExpired(m.expiry_date)).length;
    return { total, lowStockCount, expiredCount };
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medicines;
    return medicines.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(term) ||
        (m.category || "").toLowerCase().includes(term)
    );
  }, [medicines, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
  const pagedMedicines = filteredMedicines.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (medicine) => {
    setEditing(medicine);
    setForm({
      name: medicine.name || "",
      category: medicine.category || "",
      description: medicine.description || "",
      quantity: medicine.quantity ?? "",
      unit: medicine.unit || "",
      price: medicine.price ?? "",
      expiry_date: medicine.expiry_date ? medicine.expiry_date.slice(0, 10) : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleFormChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      setFormError("Name and category are required.");
      return;
    }
    if (form.quantity === "" || Number(form.quantity) < 0) {
      setFormError("Enter a valid quantity (0 or more).");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      setFormError("Enter a valid price (0 or more).");
      return;
    }
    try {
      setSaving(true);
      setFormError("");
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        expiry_date: form.expiry_date || null,
      };
      if (editing) {
        await medicineService.update(editing.id, payload);
      } else {
        await medicineService.create(payload);
      }
      setShowModal(false);
      await loadMedicines();
    } catch (err) {
      console.error("Failed to save medicine:", err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : "") ||
        "Couldn’t save the item. Check the details and try again.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (medicine) => setPendingDelete(medicine);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await medicineService.delete(pendingDelete.id);
      setPendingDelete(null);
      await loadMedicines();
    } catch (err) {
      console.error("Failed to delete medicine:", err);
      setError("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Inventory"
        subtitle="Track pharmaceutical stock, expiration dates, and availability."
        actions={
          canCreate && (
            <Button onClick={openAdd}>
              <Plus size={18} />
              Add Medicine
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total items" value={stats.total} icon={Package} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard label="Low stock" value={stats.lowStockCount} icon={AlertTriangle} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <StatCard label="Expired" value={stats.expiredCount} icon={PackageX} tone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name or category..."
        className="max-w-md"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="p-3.5 text-left">Name</th>
                <th className="p-3.5 text-left">Category</th>
                <th className="p-3.5 text-left">Quantity</th>
                <th className="p-3.5 text-left">Price</th>
                <th className="p-3.5 text-left">Expiry</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="p-3.5">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: j === 0 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pagedMedicines.length > 0 ? (
                pagedMedicines.map((medicine) => {
                  const expired = isExpired(medicine.expiry_date);
                  const lowStock = isLowStock(medicine.quantity);
                  return (
                    <tr key={medicine.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Pill size={15} />
                          </div>
                          {medicine.name}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {medicine.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${lowStock ? "text-amber-600" : "text-slate-700 dark:text-slate-200"}`}>
                            {medicine.quantity}
                          </span>
                          {lowStock && (
                            <Badge tone="amber" label="Low Stock" dot={false} />
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-200">{currency(medicine.price)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={expired ? "font-medium text-red-600" : "text-slate-600 dark:text-slate-300"}>
                            {formatDate(medicine.expiry_date)}
                          </span>
                          {expired && <Badge tone="red" label="Expired" dot={false} />}
                        </div>
                      </td>
                      <td className="whitespace-nowrap p-3.5 text-right">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(medicine)}
                            className="text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-950/40"
                          >
                            <Pencil size={15} />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(medicine)}
                            className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                          >
                            <Trash2 size={15} />
                            Delete
                          </Button>
                        )}
                        {!canUpdate && !canDelete && <span className="text-xs text-slate-400">Read only</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Search size={24} strokeWidth={1.5} />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No items found</p>
                      <p className="text-xs text-slate-400">
                        {search ? "Try a different search." : "Add a medicine to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredMedicines.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            from={(page - 1) * pageSize + 1}
            to={Math.min(page * pageSize, filteredMedicines.length)}
            total={filteredMedicines.length}
            label="items"
          />
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        icon={Pill}
        title={editing ? "Edit Medicine" : "Add Medicine"}
        subtitle={editing ? "Update this medicine's stock details." : "Register a new medicine in inventory."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} type="submit" form="medicine-form">
              {saving ? "Saving…" : editing ? "Update Medicine" : "Save Medicine"}
            </Button>
          </>
        }
      >
        <form id="medicine-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <TextInput type="text" required value={form.name} onChange={handleFormChange("name")} placeholder="e.g. Paracetamol" />
            </Field>
            <Field label="Category">
              <TextInput type="text" required value={form.category} onChange={handleFormChange("category")} placeholder="e.g. Analgesic" />
            </Field>
          </div>

          <Field label="Description">
            <TextArea rows={2} value={form.description} onChange={handleFormChange("description")} placeholder="Optional description" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity">
              <TextInput type="number" min="0" step="1" required value={form.quantity} onChange={handleFormChange("quantity")} placeholder="0" />
            </Field>
            <Field label="Unit">
              <TextInput type="text" required value={form.unit} onChange={handleFormChange("unit")} placeholder="e.g. tablet" />
            </Field>
            <Field label="Price ($)">
              <TextInput type="number" min="0" step="0.01" required value={form.price} onChange={handleFormChange("price")} placeholder="0.00" />
            </Field>
          </div>

          <Field label="Expiry Date">
            <TextInput type="date" value={form.expiry_date} onChange={handleFormChange("expiry_date")} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        size="sm"
        title="Delete this medicine?"
        subtitle={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed from inventory. This can't be undone.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;