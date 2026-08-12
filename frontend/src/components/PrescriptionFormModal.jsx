import { useEffect, useMemo, useReducer, useState } from 'react';
import prescriptionService from '../services/prescriptionService';
import { getPatients } from '../services/patientService';
import { getDoctors } from '../services/doctorService';
import medicineService from '../services/medicineService';
import medicalRecordService from '../services/medicalRecordService';

// One blank line-item row
const emptyItem = () => ({
  key: crypto.randomUUID(),
  medicine_id: '',
  quantity: '',
  dosage: '',
  frequency: '',
  duration: '',
  instruction: '',
});

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
  patient_id: '',
  doctor_id: '',
  medical_record_id: '',
  prescription_date: todayISO(),
  notes: '',
});

// Groups the core prescription fields into one state object so a "reset"
// or "clear one field" only ever needs a single setState/dispatch call,
// instead of one setState per field.
function formReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return initialForm();
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'CLEAR_MEDICAL_RECORD':
      return state.medical_record_id ? { ...state, medical_record_id: '' } : state;
    default:
      return state;
  }
}

/**
 * PrescriptionFormModal
 * Create-prescription dialog. Mirrors the `prescriptions` + `prescription_items`
 * schema: patient_id, doctor_id, medical_record_id, prescription_date, notes,
 * and a list of medicine line items.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onCreated: (prescription) => void   fired after a successful save
 */
const PrescriptionFormModal = ({ open, onClose, onCreated }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [form, dispatchForm] = useReducer(formReducer, undefined, initialForm);
  const [items, setItems] = useState([emptyItem()]);

  // errors + submitError are both "form status" and change together, so
  // they're merged into one object to avoid two setState calls per update.
  const [status, setStatus] = useState({ errors: {}, submitError: '' });
  const [submitting, setSubmitting] = useState(false);

  // Reset form each time the modal opens — a single dispatch/setState per
  // piece of state, instead of one call per individual field.
  useEffect(() => {
    if (!open) return;
    dispatchForm({ type: 'RESET' });
    setItems([emptyItem()]);
    setStatus({ errors: {}, submitError: '' });
  }, [open]);

  // Load lookup lists once the modal opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const loadLookups = async () => {
      try {
        setLoadingLookups(true);
        const [patientsRes, doctorsRes, medicinesRes] = await Promise.all([
          getPatients(),
          getDoctors(),
          medicineService.getAll(),
        ]);

        const unwrap = (res) => res.data?.data?.data || res.data?.data || res.data || [];

        if (isMounted) {
          setPatients(Array.isArray(unwrap(patientsRes)) ? unwrap(patientsRes) : []);
          setDoctors(Array.isArray(unwrap(doctorsRes)) ? unwrap(doctorsRes) : []);
          setMedicines(Array.isArray(unwrap(medicinesRes)) ? unwrap(medicinesRes) : []);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    };

    loadLookups();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Load medical records scoped to the selected patient
  useEffect(() => {
    if (!form.patient_id) {
      setMedicalRecords([]);
      dispatchForm({ type: 'CLEAR_MEDICAL_RECORD' });
      return;
    }
    let isMounted = true;

    const loadRecords = async () => {
      try {
        setLoadingRecords(true);
        const res = await medicalRecordService.getByPatient(form.patient_id);
        const data = res.data?.data?.data || res.data?.data || res.data || [];
        if (isMounted) setMedicalRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load medical records:', error);
        if (isMounted) setMedicalRecords([]);
      } finally {
        if (isMounted) setLoadingRecords(false);
      }
    };

    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [form.patient_id]);

  const medicineById = useMemo(
    () => Object.fromEntries(medicines.map((m) => [String(m.id), m])),
    [medicines]
  );

  const setField = (field, value) => dispatchForm({ type: 'SET_FIELD', field, value });

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const validate = () => {
    const next = {};
    if (!form.patient_id) next.patient_id = 'Select a patient';
    if (!form.doctor_id) next.doctor_id = 'Select a doctor';
    if (!form.medical_record_id) next.medical_record_id = 'Select a medical record';
    if (!form.prescription_date) next.prescription_date = 'Pick a date';

    const itemErrors = items.map((it) => {
      const e = {};
      if (!it.medicine_id) e.medicine_id = 'Required';
      if (!it.quantity || Number(it.quantity) <= 0) e.quantity = 'Required';
      if (!it.dosage.trim()) e.dosage = 'Required';
      if (!it.frequency.trim()) e.frequency = 'Required';
      if (!it.duration.trim()) e.duration = 'Required';
      return e;
    });
    if (itemErrors.some((e) => Object.keys(e).length > 0)) next.items = itemErrors;

    setStatus((prev) => ({ ...prev, errors: next }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prev) => ({ ...prev, submitError: '' }));
    if (!validate()) return;

    const payload = {
      ...form,
      notes: form.notes.trim() || null,
        items: items.map((item) => ({
        medicine_id: Number(item.medicine_id),
        quantity: Number(item.quantity),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration.trim(),
})),
    };

    try {
      setSubmitting(true);
      const res = await prescriptionService.create(payload);
      const created = res.data?.data || res.data || payload;
      onCreated?.(created);
      onClose();
    } catch (error) {
      console.error('Failed to create prescription:', error);
      setStatus((prev) => ({
        ...prev,
        submitError:
          error?.response?.data?.message || 'Something went wrong while saving. Please try again.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const { errors, submitError } = status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={submitting ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-blue-50/60 to-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Prescription</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Attach medicines to a patient's medical record
            </p>
          </div>
          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {loadingLookups ? (
              <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
                <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading form data...
              </div>
            ) : (
              <>
                {/* Core details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Patient" error={errors.patient_id}>
                    <select
                      className={selectClass(errors.patient_id)}
                      value={form.patient_id}
                      onChange={(e) => setField('patient_id', e.target.value)}
                    >
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {`${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient #${p.id}`}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Doctor" error={errors.doctor_id}>
                    <select
                      className={selectClass(errors.doctor_id)}
                      value={form.doctor_id}
                      onChange={(e) => setField('doctor_id', e.target.value)}
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {`Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim() || `Doctor #${d.id}`}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Medical Record" error={errors.medical_record_id}>
                    <select
                      className={selectClass(errors.medical_record_id)}
                      value={form.medical_record_id}
                      onChange={(e) => setField('medical_record_id', e.target.value)}
                      disabled={!form.patient_id || loadingRecords}
                    >
                      <option value="">
                        {!form.patient_id
                          ? 'Select a patient first'
                          : loadingRecords
                          ? 'Loading records...'
                          : 'Select medical record'}
                      </option>
                      {medicalRecords.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title || r.diagnosis || `Record #${r.id}`} {r.visit_date ? `— ${r.visit_date}` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Prescription Date" error={errors.prescription_date}>
                    <input
                      type="date"
                      className={selectClass(errors.prescription_date)}
                      value={form.prescription_date}
                      onChange={(e) => setField('prescription_date', e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Notes (optional)">
                  <textarea
                    rows={2}
                    placeholder="Any additional context for this prescription..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                  />
                </Field>

                {/* Medicine line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
                      Medicines
                    </h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span className="text-base leading-none">+</span> Add medicine
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const itemErr = errors.items?.[idx] || {};
                      const selectedMedicine = medicineById[String(item.medicine_id)];
                      return (
                        <div
                          key={item.key}
                          className="relative bg-slate-50 border border-slate-200 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              Item {idx + 1}
                            </span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.key)}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                                aria-label="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="Medicine" error={itemErr.medicine_id} compact>
                              <select
                                className={selectClass(itemErr.medicine_id)}
                                value={item.medicine_id}
                                onChange={(e) => updateItem(item.key, 'medicine_id', e.target.value)}
                              >
                                <option value="">Select medicine</option>
                                {medicines.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </Field>

                            <Field label="Quantity" error={itemErr.quantity} compact>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 30"
                                className={selectClass(itemErr.quantity)}
                                value={item.quantity}
                                onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                              />
                            </Field>

                            <Field label="Dosage" error={itemErr.dosage} compact>
                              <input
                                type="text"
                                placeholder="e.g. 500mg"
                                className={selectClass(itemErr.dosage)}
                                value={item.dosage}
                                onChange={(e) => updateItem(item.key, 'dosage', e.target.value)}
                              />
                            </Field>

                            <Field label="Frequency" error={itemErr.frequency} compact>
                              <input
                                type="text"
                                placeholder="e.g. Twice daily"
                                className={selectClass(itemErr.frequency)}
                                value={item.frequency}
                                onChange={(e) => updateItem(item.key, 'frequency', e.target.value)}
                              />
                            </Field>

                            <Field label="Duration" error={itemErr.duration} compact>
                              <input
                                type="text"
                                placeholder="e.g. 7 days"
                                className={selectClass(itemErr.duration)}
                                value={item.duration}
                                onChange={(e) => updateItem(item.key, 'duration', e.target.value)}
                              />
                            </Field>

                            <Field label="Instruction" compact>
                              <input
                                type="text"
                                placeholder="e.g. After meals"
                                className={selectClass()}
                                value={item.instruction}
                                onChange={(e) => updateItem(item.key, 'instruction', e.target.value)}
                              />
                            </Field>
                          </div>

                          {selectedMedicine?.unit && (
                            <p className="text-xs text-slate-400 mt-2">
                              Unit: {selectedMedicine.unit}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {submitError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {submitError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingLookups}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitting ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Small helpers kept local to this file
const selectClass = (error) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
      : 'border-slate-300 focus:ring-blue-500/40 focus:border-blue-500'
  }`;

const Field = ({ label, error, compact, children }) => (
  <div>
    <label className={`block font-medium text-slate-600 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

export default PrescriptionFormModal;