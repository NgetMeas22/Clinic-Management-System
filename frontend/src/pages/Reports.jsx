import { useEffect, useState } from "react";
import reportService from "../services/reportService";

export default function Reports() {
    const [type, setType] = useState("patients");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadReport = async () => {
            try {
                setLoading(true);
                let response;

                switch (type) {
                    case "patients":
                        response = await reportService.getPatients();
                        break;
                    case "doctors":
                        response = await reportService.getDoctors();
                        break;
                    case "appointments":
                        response = await reportService.getAppointments();
                        break;
                    case "payments":
                        response = await reportService.getPayments();
                        break;
                    case "medicines":
                        response = await reportService.getMedicines();
                        break;
                    default:
                        response = { data: [] };
                }

                setData(response.data?.data || []);
            } catch (error) {
                console.error("Failed to load report", error);
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [type]);

    const renderTableHeader = () => {
        switch (type) {
            case "patients":
                return (
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                    </tr>
                );
            case "doctors":
                return (
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    </tr>
                );
            case "appointments":
                return (
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                );
            case "payments":
                return (
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                );
            case "medicines":
                return (
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    </tr>
                );
            default:
                return null;
        }
    };

    const renderTableRow = (item, index) => {
        const itemKey = item.id || index;

        switch (type) {
            case "patients":
                return (
                    <tr key={itemKey} className="border-t">
                        <td className="px-6 py-4 text-sm">{item.id}</td>
                        <td className="px-6 py-4 text-sm font-medium">{`${item.first_name || ""} ${item.last_name || ""}`.trim()}</td>
                        <td className="px-6 py-4 text-sm">{item.phone}</td>
                        <td className="px-6 py-4 text-sm">{item.gender}</td>
                    </tr>
                );
            case "doctors":
                return (
                    <tr key={itemKey} className="border-t">
                        <td className="px-6 py-4 text-sm">{item.id}</td>
                        <td className="px-6 py-4 text-sm font-medium">{item.user?.name || "-"}</td>
                        <td className="px-6 py-4 text-sm">{item.specialization}</td>
                        <td className="px-6 py-4 text-sm">{item.user?.phone || "-"}</td>
                    </tr>
                );
            case "appointments":
                return (
                    <tr key={itemKey} className="border-t">
                        <td className="px-6 py-4 text-sm">{item.id}</td>
                        <td className="px-6 py-4 text-sm">{item.patient ? `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim() : "-"}</td>
                        <td className="px-6 py-4 text-sm">{item.doctor?.user?.name || "-"}</td>
                        <td className="px-6 py-4 text-sm">{item.appointment_date}</td>
                        <td className="px-6 py-4 text-sm">{item.status}</td>
                    </tr>
                );
            case "payments":
                return (
                    <tr key={itemKey} className="border-t">
                        <td className="px-6 py-4 text-sm">{item.id}</td>
                        <td className="px-6 py-4 text-sm">{item.patient ? `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim() : "-"}</td>
                        <td className="px-6 py-4 text-sm">${item.amount}</td>
                        <td className="px-6 py-4 text-sm">{item.payment_method}</td>
                        <td className="px-6 py-4 text-sm">{item.payment_status}</td>
                    </tr>
                );
            case "medicines":
                return (
                    <tr key={itemKey} className="border-t">
                        <td className="px-6 py-4 text-sm">{item.id}</td>
                        <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-sm">{item.quantity ?? item.stock}</td>
                        <td className="px-6 py-4 text-sm">${item.price}</td>
                    </tr>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Reports</h1>

            <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border rounded-lg px-4 py-2 mb-6 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="patients">Patient Report</option>
                <option value="doctors">Doctor Report</option>
                <option value="appointments">Appointment Report</option>
                <option value="payments">Payment Report</option>
                <option value="medicines">Medicine Report</option>
            </select>

            {loading ? (
                <div className="p-6 bg-white rounded-xl shadow-sm text-gray-500">
                    Loading report...
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b">
                            {renderTableHeader()}
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => renderTableRow(item, index))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No data available for this report.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
