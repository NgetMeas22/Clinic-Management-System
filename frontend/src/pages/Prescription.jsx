import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, ClipboardList, Pill, Plus, User } from "lucide-react";
import prescriptionService from "../services/prescriptionService";
import { useAuth } from "../context/AuthContext";
import { can } from "../utils/permissions";
import PrescriptionFormModal from "../components/PrescriptionFormModal";
import { Button, Card, PageHeader, Pagination, SearchInput } from "../components/ui";
import useUrlSearch from "../hooks/useUrlSearch";
import unwrapPaginator from "../utils/paginate";

const formatDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const initials = (first = "", last = "") =>
  `${first.charAt(0) || ""}${last.charAt(0) || ""}`.toUpperCase() || "?";

const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useUrlSearch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const canCreate = can(user, "prescriptions", "create");

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, per_page: 8 };
      if (query) params.search = query;

      const response = await prescriptionService.getAll(params);
      const { items, meta } = unwrapPaginator(response);
      setPrescriptions(items);
      setMeta(meta);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setError("We couldn't load prescriptions. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch sets loading state
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setPage(1);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCreated = async () => {
    setToast("Prescription created successfully.");
    await fetchPrescriptions();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Prescriptions"
        subtitle="Manage patient prescriptions and medication plans."
        actions={
          canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add Prescription
            </Button>
          )
        }
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0" />
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
          <button
            onClick={fetchPrescriptions}
            className="ml-2 text-sm font-semibold underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search patient, medicine, or #ID..."
        className="max-w-md"
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padded>
              <div className="space-y-3">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </Card>
          ))}
        </div>
      ) : prescriptions.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {prescriptions.map((prescription) => {
            const patientName = prescription.patient
              ? `${prescription.patient.first_name || ""} ${prescription.patient.last_name || ""}`.trim()
              : "Unknown patient";
            const doctorName = prescription.doctor
              ? `${prescription.doctor.first_name || ""} ${prescription.doctor.last_name || ""}`.trim()
              : "";
            const itemCount = (prescription.items || []).length;

            return (
              <Card key={prescription.id} padded className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    {prescription.patient?.avatar_url ? (
                      <img
                        src={prescription.patient.avatar_url}
                        alt="Patient"
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {initials(prescription.patient?.first_name, prescription.patient?.last_name)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">{patientName}</h2>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Prescription #{prescription.id}
                        {doctorName && <> &middot; Dr. {doctorName}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatDate(prescription.prescription_date)}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {itemCount} medicine{itemCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {prescription.notes && (
                  <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    {prescription.notes}
                  </p>
                )}

                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Prescribed Medicines
                  </h3>
                  {prescription.items && prescription.items.length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {prescription.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                              <Pill size={14} />
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.medicine?.name || "Unknown Medicine"}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                            <p><span className="font-medium text-slate-700 dark:text-slate-200">Qty:</span> {item.quantity}</p>
                            <p><span className="font-medium text-slate-700 dark:text-slate-200">Dosage:</span> {item.dosage}</p>
                            <p><span className="font-medium text-slate-700 dark:text-slate-200">Frequency:</span> {item.frequency}</p>
                            <p><span className="font-medium text-slate-700 dark:text-slate-200">Duration:</span> {item.duration}</p>
                          </div>
                          <p className="border-t border-slate-200/60 pt-2 text-xs italic text-slate-500 dark:border-slate-700">
                            Instruction: {item.instruction || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">No medicine items attached.</p>
                  )}
                </div>
              </Card>
            );
          })}
          </div>
          <Pagination
            page={meta.currentPage}
            totalPages={meta.lastPage}
            onPageChange={setPage}
            from={meta.from}
            to={meta.to}
            total={meta.total}
            label="prescriptions"
          />
        </>
      ) : (
        <Card padded className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <User size={22} />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {query ? "No prescriptions match your search." : "No prescriptions found."}
          </p>
          {!query && canCreate && (
            <Button variant="secondary" className="mt-4" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              Create the first one
            </Button>
          )}
        </Card>
      )}

      <PrescriptionFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default Prescriptions;