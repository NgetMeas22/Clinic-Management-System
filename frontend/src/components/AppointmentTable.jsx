import { Calendar, CalendarDays, Clock, MoreVertical, Pencil, Plus, SlidersHorizontal, Trash2, User } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Pagination,
  SearchInput,
  SelectInput,
} from "../components/ui";
import { statusTone } from "../components/ui";

export default function AppointmentsManager({
  appointments = [],
  meta = { currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 },
  onPageChange,
  search,
  setSearch,
  status,
  setStatus,
  onAdd,
  onEdit,
  onDelete,
}) {
  const statusFilter = status || "All Statuses";
  const updateSearch = (value) => setSearch(value);
  const updateStatus = (value) => setStatus(value === "All Statuses" ? "" : value);

  const getInitials = (firstName = "", lastName = "") => {
    const first = firstName ? firstName[0] : "";
    const last = lastName ? lastName[0] : "";
    return (first + last).toUpperCase() || "P";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Appointments"
        subtitle="Manage and track patient consultation schedules."
        actions={
          onAdd && (
            <Button onClick={onAdd}>
              <Plus size={18} />
              New Appointment
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <SearchInput
          value={search}
          onChange={updateSearch}
          placeholder="Search patient, doctor, or reason..."
          className="md:max-w-sm"
        />
        <SelectInput
          value={statusFilter}
          onChange={(e) => updateStatus(e.target.value)}
          className="w-full md:w-44"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </SelectInput>

        <Button
          variant="secondary"
          onClick={() => {
            updateSearch("");
            updateStatus("All Statuses");
          }}
          title="Reset filters"
          className="w-full md:w-auto"
        >
          <SlidersHorizontal size={16} />
          Reset
        </Button>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5 text-left">Patient Name</th>
                <th className="px-6 py-3.5 text-left">Doctor</th>
                <th className="px-6 py-3.5 text-left">Schedule</th>
                <th className="px-6 py-3.5 text-left">Reason</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CalendarDays size={26} strokeWidth={1.5} />
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        No appointments found.
                      </p>
                      <p className="text-xs text-slate-400">
                        {search || statusFilter !== "All Statuses"
                          ? "Try a different search or filter."
                          : "Schedule a new consultation to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((item) => {
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
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.patient?.avatar_url ? (
                            <img
                              src={item.patient.avatar_url}
                              alt={patientName}
                              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {getInitials(
                                item.patient?.first_name,
                                item.patient?.last_name
                              )}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {patientName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.patient?.phone || "No phone linked"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {doctorName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.doctor?.specialization || "General Practice"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{item.appointment_date || "N/A"}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={12} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      <td className="max-w-xs truncate px-6 py-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-block rounded border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.reason || "General Checkup"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Badge tone={statusTone(item.status)} label={item.status || "pending"} />
                      </td>

                      <td className="relative px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              className="text-blue-600 hover:!bg-blue-50 dark:text-blue-400 dark:hover:!bg-blue-950/40"
                            >
                              <Pencil size={14} />
                              Edit
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(item.id)}
                              className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950/30"
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          )}
                          {!onEdit && !onDelete && (
                            <MoreVertical size={18} className="text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {appointments.length > 0 && (
          <Pagination
            page={meta.currentPage}
            totalPages={meta.lastPage}
            onPageChange={onPageChange}
            from={meta.from}
            to={meta.to}
            total={meta.total}
            label="appointments"
          />
        )}
      </Card>
    </div>
  );
}