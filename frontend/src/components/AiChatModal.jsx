import { useState, useRef, useEffect } from "react";
import { askAiAssistant } from "../services/aiService";
import { Button, Modal } from "./ui";
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Stethoscope,
  CalendarClock,
} from "lucide-react";
import { useLocale } from "../context/LocaleContext";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export default function AiChatModal({ isOpen, onClose }) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, loading, isOpen]);

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === "string" && textToSend ? textToSend : prompt;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await askAiAssistant(query);
      const reply = res?.reply || t("ai.error");
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg = err.response?.data?.error || t("ai.error");
      setMessages((prev) => [...prev, { sender: "ai", text: errorMsg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("ai.title")}
      subtitle={t("ai.status")}
      icon={Bot}
      size="lg"
    >
      <div className="flex h-[480px] flex-col">
        {/* Header action bar */}
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {t("ai.suggestLabel")}
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("ai.clear")}
            </button>
          )}
        </div>

        {/* Conversation body */}
        <div className="flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
                <Bot className="h-8 w-8" />
              </div>
              <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("ai.greeting")}
              </p>
              <p className="mb-5 max-w-xs text-xs text-slate-400">
                {t("ai.status")}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleSend(t("ai.suggest1"))}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                  {t("ai.suggest1")}
                </button>
                <button
                  onClick={() => handleSend(t("ai.suggest2"))}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                  {t("ai.suggest2")}
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : msg.error
                    ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("ai.placeholder")}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="shrink-0 rounded-xl px-4"
            title={t("ai.send")}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{t("ai.send")}</span>
          </Button>
        </form>
      </div>
    </Modal>
  );
}
