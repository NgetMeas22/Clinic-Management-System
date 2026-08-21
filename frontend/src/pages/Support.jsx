import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // បើក import ឡើងវិញ
import { useLocale } from "../context/LocaleContext";
import axios from "../api/axios";

const FAQS = [
  { key: "faqQ1", answer: "faqA1" },
  { key: "faqQ2", answer: "faqA2" },
  { key: "faqQ3", answer: "faqA3" },
];

const QUICK_CHECKS = [
  { key: "support.check1" },
  { key: "support.check2" },
  { key: "support.check3" },
  { key: "support.check4" },
];

export default function Support() {
  const { user } = useAuth(); // បើកប្រើ user ឡើងវិញ
  const { t } = useLocale();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError(t("support.formError"));
      return;
    }

    setSending(true);

    try {
      // ផ្ញើតិន្នន័យទៅ Backend Laravel ដើម្បីផ្ញើបន្តចូល Telegram
      await axios.post("/support/send", {
        subject: subject.trim(),
        message: message.trim(),
        user_name: user?.name,
        user_email: user?.email,
      });

      setSent(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("មានបញ្ហាក្នុងការផ្ញើសារ! សូមព្យាយាមម្តងទៀត។");
    } finally {
      setSending(false);
    }
  }; // បិទ handleSubmit ត្រឹមត្រូវ

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("support.title")}</h1>
        <p className="text-sm text-slate-500">{t("support.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Mail className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t("support.email")}</p>
          <p className="text-sm text-slate-500">{t("support.emailValue")}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Phone className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t("support.phone")}</p>
          <p className="text-sm text-slate-500">{t("support.phoneValue")}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <HelpCircle className="text-blue-600" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t("support.response")}</p>
          <p className="text-sm text-slate-500">{t("support.responseValue")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact form */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={18} />
            <h2 className="font-bold text-slate-900 dark:text-white">{t("support.contactTitle")}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">{t("support.contactSubtitle")}</p>

          {sent ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
              <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
              <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {t("support.formSuccess")}
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
              >
                <Send size={14} />
                {t("support.formReset")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("support.formSubject")}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("support.formSubjectPlaceholder")}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("support.formMessage")}
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("support.formMessagePlaceholder")}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/20 transition-colors disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? t("support.formSending") : t("support.formSend")}
              </button>
            </form>
          )}
        </div>

        {/* Quick checks */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-bold text-slate-900 dark:text-white">{t("support.quickChecks")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {QUICK_CHECKS.map(({ key }) => (
              <li key={key} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                {t(key)}
              </li>
            ))}
          </ul>

          <h2 className="mt-6 font-bold text-slate-900 dark:text-white">{t("support.faq")}</h2>
          <div className="mt-3 space-y-2">
            {FAQS.map(({ key, answer }, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {t(key)}
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {t(answer)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}   