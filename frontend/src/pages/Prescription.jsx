import { useEffect, useState } from 'react';
import prescriptionService from '../services/prescriptionService';


const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await prescriptionService.getAll();

        // Handle various API response structures safely
        const data = response.data?.data || response.data || [];

        if (isMounted) {
          setPrescriptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load prescriptions:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrescriptions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading prescriptions...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage patient prescriptions and medication plans</p>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm">
          <span>+</span> Add Prescription
        </button>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-6">
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md"
            >
              {/* Prescription Header Info */}
              <div className="flex flex-wrap justify-between items-start border-b border-slate-100 pb-4 mb-4 gap-4">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">
                    Prescription #{prescription.id}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">Patient:</span>{' '}
                    {prescription.patient
                      ? `${prescription.patient.first_name || ''} ${prescription.patient.last_name || ''}`.trim()
                      : 'N/A'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    Date: {prescription.prescription_date || 'N/A'}
                  </span>
                </div>
              </div>

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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            No prescriptions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;