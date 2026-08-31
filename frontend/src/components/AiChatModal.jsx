import { useState } from "react";
import { askAiAssistant } from "../services/aiService";
import { Button, Modal } from "./ui";
import { Bot, Send, Loader2 } from "lucide-react";
import { useLocale } from "../context/LocaleContext";

export default function AiChatModal({ isOpen, onClose }) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await askAiAssistant(userMessage);
      setMessages((prev) => [...prev, { sender: "ai", text: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: t("ai.error") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={t("ai.title")} icon={Bot}>
      <div className="flex h-[420px] flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="mt-10 text-center text-gray-500">
              <Bot className="mx-auto mb-2 h-10 w-10 text-blue-500" />
              <p>{t("ai.greeting")}</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-3 text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "border bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 justify-start text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{t("ai.thinking")}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("ai.placeholder")}
            className="flex-1 rounded-lg border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <Button type="submit" disabled={loading || !prompt.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Modal>
  );
}