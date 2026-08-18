import { useEffect, useMemo, useState } from 'react';
import paymentService from "../services/paymentService";
import { getPatients } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
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
    Trash: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
        </svg>
    ),
    Dollar: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Clock: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
    ),
    Check: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M20 6 9 17l-5-5" />
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
    Card: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
        </svg>
    ),
    Cash: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
};

const currency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const initials = (first = '', last = '') =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';

const STATUS_STYLES = {
    paid: { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    pending: { text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    cancelled: { text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

const StatusPill = ({ status }) => {
    const key = (status || '').toLowerCase();
    const style = STATUS_STYLES[key] || { text: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        </span>
    );
};

const MethodBadge = ({ method }) => {
    const key = (method || '').toLowerCase();
    const IconEl = key === 'cash' ? Icon.Cash : Icon.Card;
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <IconEl className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{method || '—'}</span>
        </span>
    );
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

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
    patient_id: '',
    appointment_id: '',
    amount: '',
    payment_method: 'cash',
    payment_status: 'pending',
    payment_date: todayISO(),
    notes: '',
};

const Billing = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loadingLookups, setLoadingLookups] = useState(false);

    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const canCreate = can(user, "payments", "create");
    const canDelete = can(user, "payments", "delete");

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await paymentService.getAll({
                payment_status: status || undefined,
            });
            setPayments(response.data?.data || []);
        } catch (err) {
            console.error('Failed to load payments:', err);
            setError('We couldn\u2019t load payments. Try refreshing the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError('');
                const response = await paymentService.getAll({
                    payment_status: status || undefined,
                });
                if (!cancelled) {
                    setPayments(response.data?.data || []);
                }
            } catch (err) {
                console.error('Failed to load payments:', err);
                if (!cancelled) {
                    setError('We couldn\u2019t load payments. Try refreshing the page.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [status]);

    useEffect(() => {
        // eslint-disable-next-line -- intentional: only local UI state reset, no data fetching/side effects
        setPage(1);
    }, [status, search]);

    const filteredPayments = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return payments;
        return payments.filter((p) => {
            const name = `${p.patient?.first_name || ''} ${p.patient?.last_name || ''}`.toLowerCase();
            return name.includes(term) || String(p.appointment_id || '').includes(term);
        });
    }, [payments, search]);

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
    const pagedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

    const stats = useMemo(() => {
        const paid = payments.filter((p) => p.payment_status?.toLowerCase() === 'paid');
        const pending = payments.filter((p) => p.payment_status?.toLowerCase() === 'pending');
        const cancelled = payments.filter((p) => p.payment_status?.toLowerCase() === 'cancelled');
        const totalCollected = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return {
            totalCollected,
            paidCount: paid.length,
            pendingCount: pending.length,
            cancelledCount: cancelled.length,
        };
    }, [payments]);

    const confirmDelete = (payment) => setPendingDelete(payment);

    const handleDelete = async () => {
        if (!pendingDelete) return;
        try {
            setDeleting(true);
            await paymentService.delete(pendingDelete.id);
            setPendingDelete(null);
            await loadPayments();
        } catch (err) {
            console.error('Failed to delete payment:', err);
            setError('Delete failed. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const openAddModal = async () => {
        setForm(emptyForm);
        setFormError('');
        setShowAddModal(true);
        try {
            setLoadingLookups(true);
            const [patientsRes, appointmentsRes] = await Promise.all([
                getPatients(),
                getAppointments(),
            ]);
            const unwrap = (res) => res.data?.data?.data || res.data?.data || res.data || [];
            setPatients(Array.isArray(unwrap(patientsRes)) ? unwrap(patientsRes) : []);
            setAppointments(Array.isArray(unwrap(appointmentsRes)) ? unwrap(appointmentsRes) : []);
        } catch (err) {
            console.error('Failed to load billing options:', err);
            setFormError('Couldn\u2019t load patients and appointments. Try again.');
        } finally {
            setLoadingLookups(false);
        }
    };

    const handleFormChange = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const selectedPatientAppointments = useMemo(() => {
        if (!form.patient_id) return [];
        return appointments.filter((a) => String(a.patient_id) === String(form.patient_id));
    }, [appointments, form.patient_id]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.patient_id) {
            setFormError('Select a patient.');
            return;
        }
        if (!form.appointment_id) {
            setFormError('Select an appointment.');
            return;
        }
        if (!form.amount || Number(form.amount) <= 0) {
            setFormError('Enter a valid amount greater than 0.');
            return;
        }
        try {
            setSaving(true);
            setFormError('');
            await paymentService.create({
                patient_id: Number(form.patient_id),
                appointment_id: Number(form.appointment_id),
                amount: Number(form.amount),
                payment_method: form.payment_method,
                payment_status: form.payment_status,
                payment_date: form.payment_date,
                notes: form.notes || null,
            });
            setShowAddModal(false);
            await loadPayments();
        } catch (err) {
            console.log('Backend Validation Error Response:', err.response?.data);
            const errorMessage = err.response?.data?.message
                || 'Couldn\'t save the payment. Check the details and try again.';
            setFormError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and manage patient payments</p>
                </div>

                {canCreate && (
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Icon.Plus className="w-4 h-4" />
                        Add Payment
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total collected" value={currency(stats.totalCollected)} tone="bg-blue-50 text-blue-600" IconEl={Icon.Dollar} />
                <StatCard label="Paid" value={stats.paidCount} tone="bg-emerald-50 text-emerald-600" IconEl={Icon.Check} />
                <StatCard label="Pending" value={stats.pendingCount} tone="bg-amber-50 text-amber-600" IconEl={Icon.Clock} />
                <StatCard label="Cancelled" value={stats.cancelledCount} tone="bg-red-50 text-red-600" IconEl={Icon.X} />
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                    {error}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-55">
                    <Icon.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by patient or appointment #"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Patient</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Appointment</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Method</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                                <th className="p-3.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                                <th className="p-3.5 text-right font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <td key={j} className="p-3.5">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pagedPayments.length > 0 ? (
                                pagedPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Patient */}
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-2.5">
                                                {payment.patient?.avatar_url ? (
                                                    <img
                                                        src={payment.patient.avatar_url}
                                                        alt="Patient"
                                                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {initials(payment.patient?.first_name, payment.patient?.last_name)}
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900">
                                                    {payment.patient?.first_name} {payment.patient?.last_name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Appointment */}
                                        <td className="p-3.5">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                #{payment.appointment_id}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="p-3.5 font-semibold text-gray-900">
                                            {currency(payment.amount)}
                                        </td>

                                        {/* Payment Method */}
                                        <td className="p-3.5">
                                            <MethodBadge method={payment.payment_method} />
                                        </td>

                                        {/* Status */}
                                        <td className="p-3.5">
                                            <StatusPill status={payment.payment_status} />
                                        </td>

                                        {/* Date */}
                                        <td className="p-3.5 text-gray-600">
                                            {formatDate(payment.payment_date)}
                                        </td>

                                        {/* Action */}
                                        <td className="p-3.5 text-right">
                                            {canDelete ? (
                                                <button
                                                    onClick={() => confirmDelete(payment)}
                                                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                                >
                                                    <Icon.Trash className="w-3.5 h-3.5" />
                                                    Delete
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No delete</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-16">
                                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Icon.Inbox className="w-10 h-10" />
                                            <p className="text-gray-600 font-medium">No payments found</p>
                                            <p className="text-gray-400 text-xs">
                                                {search || status ? 'Try a different search or filter.' : 'Payments will appear here once recorded.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filteredPayments.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredPayments.length)} of {filteredPayments.length}
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

            {/* Add Payment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">Add Payment</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon.X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="px-5 py-4 space-y-4">
                            {formError && (
                                <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs border border-red-100">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Patient</label>
                                <select
                                    required
                                    value={form.patient_id}
                                    onChange={handleFormChange('patient_id')}
                                    disabled={loadingLookups}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {loadingLookups ? 'Loading patients...' : 'Select patient'}
                                    </option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {`${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient #${p.id}`} ({p.patient_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Appointment</label>
                                <select
                                    required
                                    value={form.appointment_id}
                                    onChange={handleFormChange('appointment_id')}
                                    disabled={loadingLookups}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {!form.patient_id
                                            ? 'Select a patient first'
                                            : loadingLookups
                                            ? 'Loading appointments...'
                                            : 'Select appointment'}
                                    </option>
                                    {selectedPatientAppointments.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            #{a.id} — {formatDate(a.appointment_date)} {a.appointment_time}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={form.amount}
                                            onChange={handleFormChange('amount')}
                                            placeholder="0.00"
                                            className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.payment_date}
                                        onChange={handleFormChange('payment_date')}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Method</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={handleFormChange('payment_method')}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="aba">ABA</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                                    <select
                                        value={form.payment_status}
                                        onChange={handleFormChange('payment_status')}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={handleFormChange('notes')}
                                    placeholder="Optional notes"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || loadingLookups}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving ? 'Saving…' : 'Save Payment'}
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
                        <h2 className="text-base font-bold text-gray-900 mb-1">Delete this payment?</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            The {currency(pendingDelete.amount)} payment for{' '}
                            <span className="font-medium text-gray-700">
                                {pendingDelete.patient?.first_name} {pendingDelete.patient?.last_name}
                            </span>{' '}
                            will be permanently removed. This can't be undone.
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
                                {deleting ? 'Deleting…' : 'Delete Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
