import { HelpCircle, Mail, Phone } from "lucide-react";

export default function Support() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support</h1>
        <p className="text-sm text-slate-500">Clinic system help desk and common recovery steps.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Mail className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">Email</p>
          <p className="text-sm text-slate-500">support@ngmclinic.local</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Phone className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">Phone</p>
          <p className="text-sm text-slate-500">+855 12 345 678</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <HelpCircle className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">Response</p>
          <p className="text-sm text-slate-500">Same business day for clinic staff.</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">Quick checks</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Check that Laravel is running on http://127.0.0.1:8000.</li>
          <li>Check that the frontend is using the same API base URL.</li>
          <li>For permission errors, confirm the logged-in user has the correct role.</li>
          <li>For password changes, use at least 8 characters.</li>
        </ul>
      </div>
    </div>
  );
}
