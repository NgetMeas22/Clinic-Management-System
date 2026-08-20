export function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (["active", "confirmed", "completed", "paid", "available"].includes(s)) return "green";
  if (["pending"].includes(s)) return "amber";
  if (["cancelled", "inactive", "expired"].includes(s)) return "red";
  if (["on_leave"].includes(s)) return "amber";
  return "slate";
}