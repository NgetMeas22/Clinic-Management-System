import { useEffect, useState, useMemo } from 'react';
import medicalRecordService from '../services/medicalRecordService';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  X,
  Stethoscope,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const MedicalRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Drawers
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const canCreate = can(user, 'medicalRecords', 'create');
  const canUpdate = can(user, 'medicalRecords', 'update');
  const canDelete = can(user, 'medicalRecords', 'delete');

  const initialFormState = {
    patient_id: '',
    doctor_id: '',
    appointment_id: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Helper to safely format patient full name
  const getPatientName = (patient) => {
    if (!patient) return 'N/A';
    if (patient.name) return patient.name;
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    return fullName || 'N/A';
  };

  // Centralized fetch function - used on mount AND after create/update/delete
  // Pass `showLoading = false` on initial mount to prevent synchronous setState in useEffect
// 1. Standalone fetch function for refetching after create/update/delete
const fetchRecords = async () => {
  try {
    setLoading(true);
    const response = await medicalRecordService.getAll();
    const data = response.data?.data?.data || response.data?.data || response.data || [];
    setRecords(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to load medical records:', error);
  } finally {
    setLoading(false);
  }
};

// 2. Initial fetch using an asynchronous Promise chain directly inside useEffect
useEffect(() => {
  let isMounted = true;

  medicalRecordService.getAll()
    .then((response) => {
      if (!isMounted) return;
      const data = response.data?.data?.data || response.data?.data || response.data || [];
      setRecords(Array.isArray(data) ? data : []);
    })
    .catch((error) => {
      console.error('Failed to load medical records:', error);
    })
    .finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

  return () => {
    isMounted = false;
  };
}, []);

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const patientName = getPatientName(rec.patient).toLowerCase();
      const doctorName = (rec.doctor?.user?.name || rec.doctor?.name || '').toLowerCase();
      const diagnosis = (rec.diagnosis || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        patientName.includes(search) || doctorName.includes(search) || diagnosis.includes(search);
      const matchesDiagnosis =
        selectedDiagnosis === 'All' ||
        (rec.diagnosis && rec.diagnosis.toLowerCase() === selectedDiagnosis.toLowerCase());

      return matchesSearch && matchesDiagnosis;
    });
  }, [records, searchTerm, selectedDiagnosis]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Unique Diagnosis List for Filter
  const uniqueDiagnoses = useMemo(() => {
    const list = records.map((r) => r.diagnosis).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [records]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setErrorMsg('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      patient_id: record.patient_id || record.patient?.id || '',
      doctor_id: record.doctor_id || record.doctor?.id || '',
      appointment_id: record.appointment_id || '',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      notes: record.notes || '',
    });
    setErrorMsg('');
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      patient_id: Number(formData.patient_id),
      doctor_id: Number(formData.doctor_id),
      appointment_id: Number(formData.appointment_id),
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms,
      treatment: formData.treatment,
      notes: formData.notes,
      visit_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    try {
      if (editingId) {
        await medicalRecordService.update(editingId, payload);
      } else {
        await medicalRecordService.create(payload);
      }
      setIsFormModalOpen(false);
      fetchRecords(); // ✅ Refresh the list after a successful save
    } catch (err) {
      console.error('Validation Error Details:', err.response?.data);

      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        if (validationErrors) {
          const firstError = Object.values(validationErrors).flat()[0];
          setErrorMsg(firstError);
        } else {
          setErrorMsg(err.response.data.message || 'Validation failed');
        }
      } else {
        setErrorMsg('Server error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await medicalRecordService.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete medical record.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Records</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage, record, and inspect clinical diagnosis and patient history.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Medical Record
          </button>
        )}
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, doctor, diagnosis..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDiagnosis}
              onChange={(e) => {
                setSelectedDiagnosis(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              {uniqueDiagnoses.map((diag) => (
                <option key={diag} value={diag}>
                  {diag === 'All' ? 'All Diagnoses' : diag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3.5 w-3/12">Patient</th>
              <th className="px-4 py-3.5 w-2/12">Attending Doctor</th>
              <th className="px-4 py-3.5 w-2/12">Diagnosis</th>
              <th className="px-4 py-3.5 w-2/12">Symptoms</th>
              <th className="px-4 py-3.5 w-2/12">Treatment</th>
              <th className="px-4 py-3.5 w-24 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-5 w-20 bg-slate-200 rounded-full"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Patient Column */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-100 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {getPatientName(record.patient)}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          ID: #{record.patient_id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Doctor Column */}
                  <td className="px-4 py-3.5 text-slate-700">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs truncate">
                        {record.doctor?.user?.name || record.doctor?.name || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Diagnosis Column */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 max-w-full truncate">
                      <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{record.diagnosis || 'Unspecified'}</span>
                    </span>
                  </td>

                  {/* Symptoms Column */}
                  <td className="px-4 py-3.5 text-xs text-slate-600 truncate">
                    {record.symptoms || '—'}
                  </td>

                  {/* Treatment Column */}
                  <td className="px-4 py-3.5 text-xs text-slate-600 truncate">
                    {record.treatment || '—'}
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3.5 text-right shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenEdit(record)}
                          className="p-1 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                          title="Edit Record"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No medical records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong className="text-slate-700">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</strong> of{' '}
            <strong className="text-slate-700">{filteredRecords.length}</strong> entries
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW RECORD MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Medical Record Details</h3>
                <p className="text-xs text-slate-400">
                  Created at:{' '}
                  {selectedRecord?.created_at
                    ? new Date(selectedRecord.created_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Patient Name</span>
                  <strong className="text-slate-800">{getPatientName(selectedRecord.patient)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Attending Doctor</span>
                  <strong className="text-slate-800">
                    {selectedRecord.doctor?.user?.name || selectedRecord.doctor?.name || 'N/A'}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Diagnosis</span>
                <p className="mt-1 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 font-medium">
                  {selectedRecord.diagnosis || 'Unspecified'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Symptoms</span>
                <p className="mt-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {selectedRecord.symptoms || 'None recorded'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Treatment Plan</span>
                <p className="mt-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {selectedRecord.treatment || 'None recorded'}
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     {/* CREATE / EDIT FORM MODAL */}
{isFormModalOpen && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {editingId ? 'Edit Medical Record' : 'Add New Medical Record'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {editingId ? 'Update existing clinical entries below.' : 'Enter diagnostic details to register a new record.'}
          </p>
        </div>
        <button
          onClick={() => setIsFormModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content - Scrollable */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50/80 text-red-700 rounded-xl text-xs border border-red-200/60">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form id="medical-record-form" onSubmit={handleSubmit} className="space-y-6 text-sm">
          
          {/* Section 1: Identifiers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. Reference Identifiers
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1042"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Doctor ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 508"
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Appointment ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 9921"
                  value={formData.appointment_id}
                  onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Clinical Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Clinical Notes
              </span>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Essential Hypertension (ICD-10 I10)"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Observed Symptoms
              </label>
              <textarea
                rows={3}
                placeholder="Describe presenting symptoms, severity, and duration (e.g. Dizziness, acute headaches)..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition resize-none"
              />
            </div>

            {/* Treatment Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Treatment Plan & Prescriptions
              </label>
              <textarea
                rows={3}
                placeholder="Outline medication, dosages, or follow-up instructions (e.g. Prescribed Amlodipine 5mg QD)..."
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0 z-10">
        <button
          type="button"
          onClick={() => setIsFormModalOpen(false)}
          className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-100 focus:ring-2 focus:ring-slate-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="medical-record-form"
          disabled={submitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm hover:shadow focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {submitting && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <span>{submitting ? 'Saving Record...' : editingId ? 'Update Record' : 'Save Record'}</span>
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default MedicalRecords;