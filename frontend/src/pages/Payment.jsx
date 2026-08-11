import { useEffect, useState } from 'react';
import paymentService from "../services/paymentService";

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch payments
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);

                const response =
                    await paymentService.getAll({
                        payment_status:
                            status || undefined,
                    });

                setPayments(
                    response.data?.data || []
                );
            } catch (error) {
                console.error(
                    'Failed to load payments:',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [status]);

    // Delete payment
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this payment?'
        );

        if (!confirmed) {
            return;
        }

        try {
            await paymentService.delete(id);

            // Reload payments after delete
            const response =
                await paymentService.getAll({
                    payment_status:
                        status || undefined,
                });

            setPayments(
                response.data?.data || []
            );
        } catch (error) {
            console.error(
                'Failed to delete payment:',
                error
            );
        }
    };

    // Loading
    if (loading) {
        return (
            <div className="p-6">
                Loading payments...
            </div>
        );
    }

    return (
        <div className="p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">

                <h1 className="text-2xl font-bold">
                    Payments
                </h1>

                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    + Add Payment
                </button>

            </div>

            {/* Status Filter */}
            <div className="mb-4">

                <select
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2"
                >

                    <option value="">
                        All Status
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Paid">
                        Paid
                    </option>

                    <option value="Cancelled">
                        Cancelled
                    </option>

                </select>

            </div>

            {/* Payment Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-3 text-left">
                                Patient
                            </th>

                            <th className="p-3 text-left">
                                Appointment
                            </th>

                            <th className="p-3 text-left">
                                Amount
                            </th>

                            <th className="p-3 text-left">
                                Method
                            </th>

                            <th className="p-3 text-left">
                                Status
                            </th>

                            <th className="p-3 text-left">
                                Date
                            </th>

                            <th className="p-3 text-left">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {payments.length > 0 ? (

                            payments.map((payment) => (

                                <tr
                                    key={payment.id}
                                    className="border-t"
                                >

                                    {/* Patient */}
                                    <td className="p-3">

                                        {payment.patient?.first_name}
                                        {' '}
                                        {payment.patient?.last_name}

                                    </td>

                                    {/* Appointment */}
                                    <td className="p-3">
                                        #{payment.appointment_id}
                                    </td>

                                    {/* Amount */}
                                    <td className="p-3">
                                        ${payment.amount}
                                    </td>

                                    {/* Payment Method */}
                                    <td className="p-3">
                                        {payment.payment_method}
                                    </td>

                                    {/* Status */}
                                    <td className="p-3">

                                        <span
                                            className={
                                                payment.payment_status ===
                                                'Paid'
                                                    ? 'text-green-600 font-semibold'
                                                    : payment.payment_status ===
                                                      'Cancelled'
                                                    ? 'text-red-600 font-semibold'
                                                    : 'text-yellow-600 font-semibold'
                                            }
                                        >
                                            {payment.payment_status}
                                        </span>

                                    </td>

                                    {/* Date */}
                                    <td className="p-3">
                                        {payment.payment_date}
                                    </td>

                                    {/* Action */}
                                    <td className="p-3">

                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    payment.id
                                                )
                                            }
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="7"
                                    className="p-6 text-center text-gray-500"
                                >
                                    No payments found.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default Payments;