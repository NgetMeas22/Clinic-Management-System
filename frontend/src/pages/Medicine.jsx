import { useState, useEffect } from 'react';
import medicineService from "../services/medicineService";

const Medicines = () => {
    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch medicines
    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                setLoading(true);

                const response = await medicineService.getAll({
                    search,
                });

                setMedicines(
                    response.data?.data || []
                );
            } catch (error) {
                console.error(
                    'Failed to load medicines:',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMedicines();
    }, [search]);

    // Delete medicine
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this medicine?'
        );

        if (!confirmed) {
            return;
        }

        try {
            await medicineService.delete(id);

            // Reload medicines after delete
            const response = await medicineService.getAll({
                search,
            });

            setMedicines(
                response.data?.data || []
            );

        } catch (error) {
            console.error(
                'Failed to delete medicine:',
                error
            );
        }
    };

    // Check expiry
    const isExpired = (expiryDate) => {
        if (!expiryDate) {
            return false;
        }

        return new Date(expiryDate) < new Date();
    };

    // Check low stock
    const isLowStock = (quantity) => {
        return quantity <= 10;
    };

    // Loading
    if (loading) {
        return (
            <div className="p-6">
                Loading medicines...
            </div>
        );
    }

    return (
        <div className="p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">

                <h1 className="text-2xl font-bold">
                    Medicines
                </h1>

                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    + Add Medicine
                </button>

            </div>

            {/* Search */}
            <div className="mb-4">

                <input
                    type="text"
                    placeholder="Search medicine..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2 w-full md:w-96"
                />

            </div>

            {/* Medicine Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-3 text-left">
                                Name
                            </th>

                            <th className="p-3 text-left">
                                Category
                            </th>

                            <th className="p-3 text-left">
                                Quantity
                            </th>

                            <th className="p-3 text-left">
                                Price
                            </th>

                            <th className="p-3 text-left">
                                Expiry
                            </th>

                            <th className="p-3 text-left">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {medicines.length > 0 ? (

                            medicines.map((medicine) => {

                                const expired =
                                    isExpired(
                                        medicine.expiry_date
                                    );

                                const lowStock =
                                    isLowStock(
                                        medicine.quantity
                                    );

                                return (
                                    <tr
                                        key={medicine.id}
                                        className="border-t"
                                    >

                                        {/* Name */}
                                        <td className="p-3">
                                            {medicine.name}
                                        </td>

                                        {/* Category */}
                                        <td className="p-3">
                                            {medicine.category}
                                        </td>

                                        {/* Quantity */}
                                        <td className="p-3">

                                            <span
                                                className={
                                                    lowStock
                                                        ? 'text-red-600 font-bold'
                                                        : ''
                                                }
                                            >
                                                {medicine.quantity}
                                            </span>

                                            {lowStock && (
                                                <span className="ml-2 text-xs text-red-600">
                                                    Low Stock
                                                </span>
                                            )}

                                        </td>

                                        {/* Price */}
                                        <td className="p-3">
                                            ${medicine.price}
                                        </td>

                                        {/* Expiry */}
                                        <td className="p-3">

                                            <span
                                                className={
                                                    expired
                                                        ? 'text-red-600 font-bold'
                                                        : ''
                                                }
                                            >
                                                {medicine.expiry_date ||
                                                    'N/A'}
                                            </span>

                                            {expired && (
                                                <span className="ml-2 text-xs text-red-600">
                                                    Expired
                                                </span>
                                            )}

                                        </td>

                                        {/* Action */}
                                        <td className="p-3">

                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        medicine.id
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>
                                );
                            })

                        ) : (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="p-6 text-center text-gray-500"
                                >
                                    No medicines found.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default Medicines;