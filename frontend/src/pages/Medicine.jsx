import { useState, useEffect, useMemo } from 'react';
import medicineService from "../services/medicineService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";

const Medicines = () => {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const canCreate = can(user, "medicines", "create");
    const canDelete = can(user, "medicines", "delete");

    // Fetch medicines with debounced search
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                setLoading(true);
                const response = await medicineService.getAll({ search });
                setMedicines(response.data || []);
            } catch (error) {
                console.error('Failed to load medicines:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [search]);

    // Format ISO dates to readable local date format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? 'N/A'
            : date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              });
    };

    // Check expiry
    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    // Check low stock
    const isLowStock = (quantity) => quantity <= 10;

    // Delete medicine
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this medicine?')) {
            return;
        }

        try {
            await medicineService.delete(id);
            // Optimistically filter out deleted item without re-fetching
            setMedicines((prev) => prev.filter((m) => m.id !== id));
        } catch (error) {
            console.error('Failed to delete medicine:', error);
        }
    };

    // Derived statistics for summary cards
    const stats = useMemo(() => {
        const total = medicines.length;
        const lowStockCount = medicines.filter((m) => isLowStock(m.quantity)).length;
        const expiredCount = medicines.filter((m) => isExpired(m.expiry_date)).length;
        return { total, lowStockCount, expiredCount };
    }, [medicines]);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Medicine Inventory
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage pharmaceutical stock, expiration dates, and availability.
                        </p>
                    </div>

                    {canCreate && (
                        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Medicine
                        </button>
                    )}
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Low Stock Warning</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{stats.lowStockCount}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Expired Items</p>
                        <p className="text-2xl font-bold text-rose-700 mt-1">{stats.expiredCount}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search medicine by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                    />
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold text-gray-500">
                                <tr>
                                    <th className="py-3.5 px-4">Name</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Quantity</th>
                                    <th className="py-3.5 px-4">Price</th>
                                    <th className="py-3.5 px-4">Expiry Date</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-400">
                                            <div className="inline-flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                                Loading medicines...
                                            </div>
                                        </td>
                                    </tr>
                                ) : medicines.length > 0 ? (
                                    medicines.map((medicine) => {
                                        const expired = isExpired(medicine.expiry_date);
                                        const lowStock = isLowStock(medicine.quantity);

                                        return (
                                            <tr key={medicine.id} className="hover:bg-gray-50/80 transition-colors">
                                                {/* Name */}
                                                <td className="py-3.5 px-4 font-medium text-gray-900">
                                                    {medicine.name}
                                                </td>

                                                {/* Category */}
                                                <td className="py-3.5 px-4 text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        {medicine.category || 'Uncategorized'}
                                                    </span>
                                                </td>

                                                {/* Quantity */}
                                                <td className="py-3.5 px-4">
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

                                                {/* Price */}
                                                <td className="py-3.5 px-4 font-mono text-gray-700">
                                                    ${Number(medicine.price).toFixed(2)}
                                                </td>

                                                {/* Expiry */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={expired ? 'text-rose-600 font-medium' : 'text-gray-600'}>
                                                            {formatDate(medicine.expiry_date)}
                                                        </span>
                                                        {expired && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                                Expired
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    {canDelete ? (
                                                        <button
                                                            onClick={() => handleDelete(medicine.id)}
                                                            className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Read only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-500">
                                            No medicines match your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Medicines;