import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Clock,
} from "lucide-react";

export default function AppointmentsManager({
  appointments = [],
  onAdd,
  onEdit,
  onDelete,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Status style helper
  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Helper to extract patient initials for avatar placeholder
  const getInitials = (firstName = "", lastName = "") => {
    const first = firstName ? firstName[0] : "";
    const last = lastName ? lastName[0] : "";
    return (first + last).toUpperCase() || "P";
  };

  // Filter appointments based on search and status filter
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const patientName = `${item.patient?.first_name || ""} ${
        item.patient?.last_name || ""
      }`.toLowerCase();
      const doctorName = (item.doctor?.user?.name || item.doctor?.name || "").toLowerCase();
      const reason = (item.reason || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        patientName.includes(query) ||
        doctorName.includes(query) ||
        reason.includes(query);

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        status === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, selectedStatus]);

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track patient consultation schedules.
          </p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>New Appointment</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search patient, doctor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Select Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider uppercase">
                <th className="py-3.5 px-6">Patient Name</th>
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6">Schedule</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((item) => {
                  const patientName =
                    item.patient?.first_name || item.patient?.last_name
                      ? `${item.patient?.first_name || ""} ${
                          item.patient?.last_name || ""
                        }`.trim()
                      : "Unassigned Patient";

                  const doctorDisplayName = item.doctor?.user?.name || item.doctor?.name;
                  const doctorName = doctorDisplayName
                    ? `Dr. ${doctorDisplayName}`
                    : "Unassigned Doctor";

                  const formattedTime = item.appointment_time
                    ? item.appointment_time.substring(0, 5)
                    : "--:--";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Patient Name with Avatar Badge */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">
                            {getInitials(
                              item.patient?.first_name,
                              item.patient?.last_name
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {patientName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.patient?.phone || "No phone linked"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Doctor Name */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-blue-600">
                          {doctorName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.doctor?.specialization || "General Practice"}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{item.appointment_date || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Clock size={12} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Reason Column */}
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 border border-slate-200/60">
                          {item.reason || "General Checkup"}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>

                      {/* Action Popup */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === item.id ? null : item.id
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === item.id && (
                          <div className="absolute right-6 top-12 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left">
                            {onEdit && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(item);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(item.id);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            )}
                            {!onEdit && !onDelete && (
                              <div className="px-3.5 py-2 text-xs font-semibold text-slate-500">
                                View only
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">1</span> to{" "}
            <span className="font-semibold text-slate-800">
              {filteredAppointments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {appointments.length}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-2 border border-slate-200 rounded-lg text-slate-300 disabled:opacity-50 cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center">
              2
            </button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
