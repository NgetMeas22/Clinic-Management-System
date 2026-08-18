import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Save, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "", 
    phone: user?.phone || "",
  }));
  const [avatarPreview, setAvatarPreview] = useState(() => user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Sync form state safely when user object loads asynchronously
  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatar_url || "");
    });
  }, [user]);

  // Clean up Object URL memory leaks when image changes or unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : user?.avatar_url || "");
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone || "");

      if (avatarFile) {
        payload.append("profile_picture", avatarFile);
      }

      await updateProfile(payload);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile could not be updated.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <UserRound size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account identity and picture.</p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-800/40 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-500 text-white shadow-lg ring-4 ring-white dark:ring-slate-900 sm:h-32 sm:w-32">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={form.name || "Profile picture"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={44} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 inline-flex items-center gap-1.5 rounded-full border border-white bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 dark:border-slate-900"
                >
                  <Camera size={14} />
                  Change
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{form.name || "Your profile"}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{form.email || "Add your email address"}</p>
              </div>

              <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-left dark:border-slate-600 dark:bg-slate-900">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Profile picture
                </label>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  JPG, PNG, or WEBP up to 2 MB.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ImageUp size={16} />
                  Upload picture
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (avatarPreview?.startsWith("blob:")) {
                        URL.revokeObjectURL(avatarPreview);
                      }
                      setAvatarFile(null);
                      setAvatarPreview(user?.avatar_url || "");
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <X size={16} />
                    Remove selection
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Name
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                Phone
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </div>

            {message && (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                <Save size={16} />
                Save profile
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your profile picture will be available in the navbar after saving.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
