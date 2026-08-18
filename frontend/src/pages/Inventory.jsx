import { useEffect, useMemo, useState } from 'react';
import medicineService from "../services/medicineService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

const Icon = {
    Search: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
    ),
    Plus: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    Edit: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
    ),
    Trash: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
        </svg>
    ),
    X: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    Inbox: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
    Package: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="M3.3 7 12 12l8.7-5M12 22V12" />
        </svg>
    ),
    Alert: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4M12 17h.01" />
        </svg>
    ),
};

const currency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const formatDate = (d) => {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

const isLowStock = (quantity) => Number(quantity) <= 10;

const emptyForm = {
    name: '',
    category: '',
    description: '',
    quantity: '',
    unit: '',
    price: '',
    expiry_date: '',
};

const StatCard = ({ label, value, tone, IconEl }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
            <IconEl className="w-5 h-5" />
        </div>
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
            <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

const Inventory = () => {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const canCreate = can(user, "medicines", "create");
    const canUpdate = can(user, "medicines", "update");
    const canDelete = can(user, "medicines", "delete");

    const loadMedicines = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await medicineService.getAll({ search: search || undefined });
            setMedicines(response?.data || []);
        } catch (err) {
            console.error('Failed to load medicines:', err);
            setError('We couldn\u2019t load the inventory. Try refreshing the page.');
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
        // eslint-disable-next-line -- intentional: only local UI state reset, no data fetching/side effects
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
        return medicines.filter((m) =>
            (m.name || '').toLowerCase().includes(term) ||
            (m.category || '').toLowerCase().includes(term)
        );
    }, [medicines, search]);

    const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
    const pagedMedicines = filteredMedicines.slice((page - 1) * pageSize, page * pageSize);

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (medicine) => {
        setEditing(medicine);
        setForm({
            name: medicine.name || '',
            category: medicine.category || '',
            description: medicine.description || '',
            quantity: medicine.quantity ?? '',
            unit: medicine.unit || '',
            price: medicine.price ?? '',
            expiry_date: medicine.expiry_date ? medicine.expiry_date.slice(0, 10) : '',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleFormChange = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.category.trim()) {
            setFormError('Name and category are required.');
            return;
        }
        if (form.quantity === '' || Number(form.quantity) < 0) {
            setFormError('Enter a valid quantity (0 or more).');
            return;
        }
        if (form.price === '' || Number(form.price) < 0) {
            setFormError('Enter a valid price (0 or more).');
            return;
        }
        try {
            setSaving(true);
            setFormError('');
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
            console.error('Failed to save medicine:', err);
            const msg = err.response?.data?.message
                || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : '')
                || 'Couldn\u2019t save the item. Check the details and try again.';
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
            console.error('Failed to delete medicine:', err);
            setError('Delete failed. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track pharmaceutical stock, expiration dates, and availability</p>
                </div>

                {canCreate && (
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Icon.Plus className="w-4 h-4" />
                        Add Medicine
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total items" value={stats.total} tone="bg-blue-50 text-blue-600" IconEl={Icon.Package} />
                <StatCard label="Low stock" value={stats.lowStockCount} tone="bg-amber-50 text-amber-600" IconEl={Icon.Alert} />
                <StatCard label="Expired" value={stats.expiredCount} tone="bg-red-50 text-red-600" IconEl={Icon.Alert} />
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                    {error}
                </div>
            )}

            {/* Toolbar */}
            <div className="relative flex-1 min-w-55 max-w-md mb-4">
                <Icon.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Quantity</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Price</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Expiry</th>
                                <th className="p-3.5 text-right font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="p-3.5">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pagedMedicines.length > 0 ? (
                                pagedMedicines.map((medicine) => {
                                    const expired = isExpired(medicine.expiry_date);
                                    const lowStock = isLowStock(medicine.quantity);
                                    return (
                                        <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3.5 font-medium text-gray-900">{medicine.name}</td>
                                            <td className="p-3.5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {medicine.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${lowStock ? 'text-amber-600' : 'text-gray-700'}`}>
                                                        {medicine.quantity}
                                                    </span>
                                                    {lowStock && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                            Low Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-mono text-gray-700">{currency(medicine.price)}</td>
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={expired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                        {formatDate(medicine.expiry_date)}
                                                    </span>
                                                    {expired && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-right whitespace-nowrap">
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => openEdit(medicine)}
                                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                                    >
                                                        <Icon.Edit className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => confirmDelete(medicine)}
                                                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                                    >
                                                        <Icon.Trash className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                )}
                                                {!canUpdate && !canDelete && (
                                                    <span className="text-gray-400 text-xs">Read only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-16">
                                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Icon.Inbox className="w-10 h-10" />
                                            <p className="text-gray-600 font-medium">No items found</p>
                                            <p className="text-gray-400 text-xs">
                                                {search ? 'Try a different search.' : 'Add a medicine to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filteredMedicines.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredMedicines.length)} of {filteredMedicines.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Medicine Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">
                                {editing ? 'Edit Medicine' : 'Add Medicine'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon.X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                            {formError && (
                                <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs border border-red-100">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={handleFormChange('name')}
                                        placeholder="e.g. Paracetamol"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.category}
                                        onChange={handleFormChange('category')}
                                        placeholder="e.g. Analgesic"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={handleFormChange('description')}
                                    placeholder="Optional description"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={form.quantity}
                                        onChange={handleFormChange('quantity')}
                                        placeholder="0"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.unit}
                                        onChange={handleFormChange('unit')}
                                        placeholder="e.g. tablet"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={form.price}
                                        onChange={handleFormChange('price')}
                                        placeholder="0.00"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry Date</label>
                                <input
                                    type="date"
                                    value={form.expiry_date}
                                    onChange={handleFormChange('expiry_date')}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving ? 'Saving…' : editing ? 'Update Medicine' : 'Save Medicine'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {pendingDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !deleting && setPendingDelete(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                            <Icon.Trash className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 mb-1">Delete this medicine?</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            <span className="font-medium text-gray-700">{pendingDelete.name}</span> will be permanently
                            removed from inventory. This can't be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setPendingDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
