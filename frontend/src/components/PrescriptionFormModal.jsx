import { useEffect, useMemo, useReducer, useState } from 'react';
import { ClipboardPlus, Trash2 } from 'lucide-react';
import prescriptionService from '../services/prescriptionService';
import { getPatients } from '../services/patientService';
import { getDoctors } from '../services/doctorService';
import medicineService from '../services/medicineService';
import medicalRecordService from '../services/medicalRecordService';
import { Button, Field, Modal, SelectInput, TextArea, TextInput } from '../components/ui';

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

const PrescriptionFormModal = ({ open, onClose, onCreated }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [form, dispatchForm] = useReducer(formReducer, undefined, initialForm);
  const [items, setItems] = useState([emptyItem()]);

  const [status, setStatus] = useState({ errors: {}, submitError: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    dispatchForm({ type: 'RESET' });
    setItems([emptyItem()]);
    setStatus({ errors: {}, submitError: '' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const loadLookups = async () => {
      try {
        setLoadingLookups(true);
        const [patientsRes, doctorsRes, medicinesRes] = await Promise.all([
          getPatients({ per_page: 200 }),
          getDoctors({ per_page: 200 }),
          medicineService.getAll({ per_page: 200 }),
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

  const { errors, submitError } = status;

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      icon={ClipboardPlus}
      title="New Prescription"
      subtitle="Attach medicines to a patient's medical record"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingLookups} type="submit" form="prescription-form">
            {submitting ? 'Saving…' : 'Save Prescription'}
          </Button>
        </>
      }
    >
      <form id="prescription-form" onSubmit={handleSubmit} className="space-y-6">
        {loadingLookups ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500 dark:text-slate-400">
            Loading form data…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Patient" error={errors.patient_id}>
                <SelectInput
                  value={form.patient_id}
                  onChange={(e) => setField('patient_id', e.target.value)}
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {`${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient #${p.id}`}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Doctor" error={errors.doctor_id}>
                <SelectInput
                  value={form.doctor_id}
                  onChange={(e) => setField('doctor_id', e.target.value)}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {`Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim() || `Doctor #${d.id}`}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Medical Record" error={errors.medical_record_id}>
                <SelectInput
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
                </SelectInput>
              </Field>

              <Field label="Prescription Date" error={errors.prescription_date}>
                <TextInput
                  type="date"
                  value={form.prescription_date}
                  onChange={(e) => setField('prescription_date', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Notes (optional)">
              <TextArea
                rows={2}
                placeholder="Any additional context for this prescription..."
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </Field>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Medicines
                </h3>
                <Button variant="secondary" size="sm" onClick={addItem}>
                  + Add medicine
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const itemErr = errors.items?.[idx] || {};
                  const selectedMedicine = medicineById[String(item.medicine_id)];
                  return (
                    <div
                      key={item.key}
                      className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Item {idx + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-slate-400 transition-colors hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Medicine" error={itemErr.medicine_id}>
                          <SelectInput
                            value={item.medicine_id}
                            onChange={(e) => updateItem(item.key, 'medicine_id', e.target.value)}
                          >
                            <option value="">Select medicine</option>
                            {medicines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </SelectInput>
                        </Field>

                        <Field label="Quantity" error={itemErr.quantity}>
                          <TextInput
                            type="number"
                            min="1"
                            placeholder="e.g. 30"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                          />
                        </Field>

                        <Field label="Dosage" error={itemErr.dosage}>
                          <TextInput
                            type="text"
                            placeholder="e.g. 500mg"
                            value={item.dosage}
                            onChange={(e) => updateItem(item.key, 'dosage', e.target.value)}
                          />
                        </Field>

                        <Field label="Frequency" error={itemErr.frequency}>
                          <TextInput
                            type="text"
                            placeholder="e.g. Twice daily"
                            value={item.frequency}
                            onChange={(e) => updateItem(item.key, 'frequency', e.target.value)}
                          />
                        </Field>

                        <Field label="Duration" error={itemErr.duration}>
                          <TextInput
                            type="text"
                            placeholder="e.g. 7 days"
                            value={item.duration}
                            onChange={(e) => updateItem(item.key, 'duration', e.target.value)}
                          />
                        </Field>

                        <Field label="Instruction">
                          <TextInput
                            type="text"
                            placeholder="e.g. After meals"
                            value={item.instruction}
                            onChange={(e) => updateItem(item.key, 'instruction', e.target.value)}
                          />
                        </Field>
                      </div>

                      {selectedMedicine?.unit && (
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          Unit: {selectedMedicine.unit}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
};

export default PrescriptionFormModal;