import { useEffect, useMemo, useState } from 'react';
import prescriptionService from '../services/prescriptionService';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import PrescriptionFormModal from '../components/PrescriptionFormModal';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const initials = (first = '', last = '') =>
  `${first.charAt(0) || ''}${last.charAt(0) || ''}`.toUpperCase() || '?';

const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  const canCreate = can(user, 'prescriptions', 'create');

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await prescriptionService.getAll();

      // Handle various API response structures safely
      const data = response.data?.data?.data || response.data?.data || response.data || [];
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setError('We couldn\u2019t load prescriptions. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) await fetchPrescriptions();
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCreated = async () => {
    setToast('Prescription created successfully.');
    await fetchPrescriptions();
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return prescriptions;
    const q = query.trim().toLowerCase();
    return prescriptions.filter((p) => {
      const patientName = `${p.patient?.first_name || ''} ${p.patient?.last_name || ''}`.toLowerCase();
      const medicineNames = (p.items || [])
        .map((it) => it.medicine?.name || '')
        .join(' ')
        .toLowerCase();
      return (
        patientName.includes(q) ||
        medicineNames.includes(q) ||
        String(p.id).includes(q)
      );
    });
  }, [prescriptions, query]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage patient prescriptions and medication plans</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, medicine, or #ID"
              className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span>+</span> Add Prescription
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading prescriptions...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 text-sm">
          {error}
          <div>
            <button
              onClick={fetchPrescriptions}
              className="mt-3 text-sm font-semibold text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.length > 0 ? (
            filtered.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md"
              >
                {/* Prescription Header Info */}
                <div className="flex flex-wrap justify-between items-start border-b border-slate-100 pb-4 mb-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {initials(prescription.patient?.first_name, prescription.patient?.last_name)}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-slate-900">
                        {prescription.patient
                          ? `${prescription.patient.first_name || ''} ${prescription.patient.last_name || ''}`.trim()
                          : 'Unknown patient'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Prescription #{prescription.id}
                        {prescription.doctor && (
                          <>
                            {' '}&middot; Dr.{' '}
                            {`${prescription.doctor.first_name || ''} ${prescription.doctor.last_name || ''}`.trim()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {formatDate(prescription.prescription_date)}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {(prescription.items || []).length} medicine
                      {(prescription.items || []).length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {prescription.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-4">
                    {prescription.notes}
                  </p>
                )}

                {/* Medicines Grid */}
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 mb-3 uppercase tracking-wider">
                    Prescribed Medicines
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {prescription.items && prescription.items.length > 0 ? (
                      prescription.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm flex flex-col justify-between"
                        >
                          <div>
                            <p className="font-bold text-blue-900 mb-1">
                              {item.medicine?.name || 'Unknown Medicine'}
                            </p>
                            <div className="space-y-0.5 text-xs text-slate-600">
                              <p><span className="font-medium text-slate-700">Quantity:</span> {item.quantity}</p>
                              <p><span className="font-medium text-slate-700">Dosage:</span> {item.dosage}</p>
                              <p><span className="font-medium text-slate-700">Frequency:</span> {item.frequency}</p>
                              <p><span className="font-medium text-slate-700">Duration:</span> {item.duration}</p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60 italic">
                            Instruction: {item.instruction || 'N/A'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No medicine items attached.</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">
                {query ? 'No prescriptions match your search.' : 'No prescriptions found.'}
              </p>
              {!query && canCreate && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Create the first one
                </button>
              )}
            </div>
          )}
        </div>
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