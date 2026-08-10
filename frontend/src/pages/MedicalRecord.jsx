import { useEffect, useState } from 'react';
import medicalRecordService from '../services/medicalRecordService';


const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await medicalRecordService.getAll();
        
        // Handle various Laravel response pagination or array structures safely
        const data = response.data?.data || response.data || [];
        
        if (isMounted) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load medical records:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecords();

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
        Loading medical records...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and view all patient clinical history</p>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm">
          <span>+</span> Add Medical Record
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Symptoms</th>
                <th className="p-4">Diagnosis</th>
                <th className="p-4">Treatment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      {record.patient
                        ? `${record.patient.first_name || ''} ${record.patient.last_name || ''}`.trim()
                        : 'N/A'}
                    </td>

                    <td className="p-4">
                      {record.doctor?.user?.name || record.doctor?.name || 'N/A'}
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {record.symptoms || '—'}
                    </td>

                    <td className="p-4 max-w-xs truncate">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {record.diagnosis || 'Unspecified'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {record.treatment || '—'}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                        View
                      </button>
                      <button className="text-slate-600 hover:text-slate-900 font-medium text-xs">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No medical records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;